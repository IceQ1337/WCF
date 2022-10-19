"use strict";
/**
 * The `<woltlab-core-date-time>` element formats a date time
 * string based on the user’s timezone and website locale. For
 *
 * @author Alexander Ebert
 * @copyright 2001-2022 WoltLab GmbH
 * @license GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @woltlabExcludeBundle all
 */
{
    // The client will always be lagging behind the server by at least a
    // fraction of a second. There are severe cases where the client will
    // be behind or ahead a couple minutes, which would severely impact
    // the accuracy of the displayed relative times.
    //
    // Adding the drift to all calculations means that the displayed value
    // will always be correct _relative_ to the client’s clock.
    const drift = Date.now() - window.TIME_NOW * 1000;
    const locale = document.documentElement.lang;
    const resolveTimeZone = () => {
        let value = "";
        const meta = document.querySelector('meta[name="timezone"]');
        if (meta) {
            value = meta.content;
            try {
                Intl.DateTimeFormat(undefined, { timeZone: value });
            }
            catch {
                value = "";
            }
        }
        if (!value) {
            value = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        return value;
    };
    const timeZone = resolveTimeZone();
    // Compute the timestamps for both the start of “today” and “yesterday”
    // for easier comparisons. Dates usually appear a lot of times on most
    // pages, computing the values ahead of time and only updating them
    // once every minute makes this process less expensive.
    let todayDayStart;
    let yesterdayDayStart;
    const updateTodayAndYesterday = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (todayDayStart !== today.getTime()) {
            todayDayStart = today.getTime();
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            yesterdayDayStart = yesterday.getTime();
        }
    };
    updateTodayAndYesterday();
    const DateFormatter = {
        // Example: November 17, 2022
        Date: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone }),
        // Example: November 17, 2022 at 11:41 AM
        DateAndTime: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone }),
        // Example: Thursday 11:41 AM
        DayOfWeekAndTime: new Intl.DateTimeFormat(locale, {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
        }),
        // Example: 16 minutes ago
        Minutes: new Intl.RelativeTimeFormat(locale),
        // Example: today
        TodayOrYesterday: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    };
    class WoltlabCoreDateTimeElement extends HTMLElement {
        #date;
        #timeElement;
        get date() {
            if (this.#date === undefined) {
                const value = this.getAttribute("date");
                if (!value) {
                    throw new Error("The 'date' attribute is missing.");
                }
                this.#date = new Date(value);
            }
            return this.#date;
        }
        set date(date) {
            this.setAttribute("date", date.toISOString());
            this.refresh(true);
        }
        get static() {
            return this.hasAttribute("static");
        }
        set static(isStatic) {
            if (isStatic === true) {
                this.setAttribute("static", "");
            }
            else {
                this.removeAttribute("static");
            }
        }
        connectedCallback() {
            this.refresh(true);
        }
        refresh(updateTitle) {
            const date = this.date;
            const difference = Math.trunc((Date.now() - date.getTime() - drift) / 1000);
            if (this.#timeElement === undefined) {
                this.#timeElement = document.createElement("time");
                const shadow = this.attachShadow({ mode: "open" });
                shadow.append(this.#timeElement);
            }
            if (updateTitle) {
                this.#timeElement.dateTime = date.toISOString();
                this.#timeElement.title = DateFormatter.DateAndTime.format(date);
            }
            let value;
            if (this.static) {
                value = this.#timeElement.title;
            }
            else {
                if (difference < 60 /* TimePeriod.OneMinute */) {
                    value = "TODO: a moment ago"; // Language.get("wcf.date.relative.now");
                }
                else if (difference < 3600 /* TimePeriod.OneHour */) {
                    const minutes = Math.trunc(difference / 60 /* TimePeriod.OneMinute */);
                    value = DateFormatter.Minutes.format(minutes * -1, "minute");
                }
                else if (date.getTime() > todayDayStart) {
                    value = this.#formatTodayOrYesterday(date, 0 /* TodayOrYesterday.Today */);
                }
                else if (date.getTime() > yesterdayDayStart) {
                    value = this.#formatTodayOrYesterday(date, -1 /* TodayOrYesterday.Yesterday */);
                }
                else if (difference < 604800 /* TimePeriod.OneWeek */) {
                    value = DateFormatter.DayOfWeekAndTime.format(date);
                }
                else {
                    value = DateFormatter.Date.format(date);
                }
            }
            value = value.charAt(0).toUpperCase() + value.slice(1);
            this.#timeElement.textContent = value;
        }
        /**
         * The date formatter does not provide a reliable way to generate
         * the “date” portion as a relative value such as “today” or
         * “tomorrow” _along_ with the time.
         *
         * This workaround will generate the date using the day of week
         * and the time, but replace the day of week with the relative
         * value.
         */
        #formatTodayOrYesterday(date, dayOffset) {
            // This will generate the localized value of “today” or “tomorrow”.
            let value = DateFormatter.TodayOrYesterday.format(dayOffset, "day");
            const dateParts = DateFormatter.DayOfWeekAndTime.formatToParts(date);
            if (dateParts[0].type === "weekday") {
                const datePartsWithoutDayOfWeek = dateParts.slice(1).map((part) => part.value);
                datePartsWithoutDayOfWeek.unshift(value);
                value = datePartsWithoutDayOfWeek.join("");
            }
            return value;
        }
    }
    window.customElements.define("woltlab-core-date-time", WoltlabCoreDateTimeElement);
    const refreshAllTimeElements = () => {
        document
            .querySelectorAll("woltlab-core-date-time")
            .forEach((element) => element.refresh(false));
    };
    let timer = undefined;
    const startTimer = () => {
        timer = window.setInterval(() => {
            updateTodayAndYesterday();
            refreshAllTimeElements();
        }, 60000);
    };
    document.addEventListener("DOMContentLoaded", () => startTimer(), { once: true });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            // Disable refreshes while the tab is in the background.
            window.clearInterval(timer);
        }
        else {
            // Immediately update the date values when the page is visible again.
            refreshAllTimeElements();
            startTimer();
        }
    });
}