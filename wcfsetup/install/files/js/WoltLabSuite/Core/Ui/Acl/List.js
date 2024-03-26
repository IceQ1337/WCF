/**
 * @woltlabExcludeBundle all
 */
define(["require", "exports", "tslib", "WoltLabSuite/Core/Ui/User/Search/Input", "WoltLabSuite/Core/Form/Builder/Field/Dependency/Manager", "WoltLabSuite/Core/Language", "WoltLabSuite/Core/Dom/Util", "WoltLabSuite/Core/StringUtil", "WoltLabSuite/Core/Ajax"], function (require, exports, tslib_1, Input_1, Manager_1, Language_1, Util_1, StringUtil, Ajax) {
    "use strict";
    Input_1 = tslib_1.__importDefault(Input_1);
    Util_1 = tslib_1.__importDefault(Util_1);
    StringUtil = tslib_1.__importStar(StringUtil);
    Ajax = tslib_1.__importStar(Ajax);
    return class ACLList {
        #categoryName;
        #container;
        #aclList;
        #permissionList;
        #searchInput;
        #objectID;
        #objectTypeID;
        #aclValuesFieldName;
        #search;
        #values;
        constructor(containerSelector, objectTypeID, categoryName, objectID, includeUserGroups, initialPermissions, aclValuesFieldName) {
            this.#objectID = objectID || 0;
            this.#objectTypeID = objectTypeID;
            this.#categoryName = categoryName;
            if (includeUserGroups === undefined) {
                includeUserGroups = true;
            }
            this.#values = {
                group: {},
                user: {},
            };
            this.#aclValuesFieldName = aclValuesFieldName || "aclValues";
            // bind hidden container
            this.#container = document.querySelector(containerSelector);
            Util_1.default.hide(this.#container);
            this.#container.classList.add("aclContainer");
            // insert container elements
            const elementContainer = this.#container.closest("dd");
            this.#aclList = document.createElement("ul");
            this.#aclList.classList.add("aclList", "containerList");
            elementContainer.appendChild(this.#aclList);
            this.#searchInput = document.createElement("input");
            this.#searchInput.type = "text";
            this.#searchInput.classList.add("long");
            this.#searchInput.placeholder = (0, Language_1.getPhrase)("wcf.acl.search." + (!includeUserGroups ? "user." : "") + "description");
            elementContainer.appendChild(this.#searchInput);
            this.#permissionList = document.createElement("ul");
            this.#permissionList.classList.add("aclPermissionList", "containerList");
            this.#permissionList.dataset.grant = (0, Language_1.getPhrase)("wcf.acl.option.grant");
            this.#permissionList.dataset.deny = (0, Language_1.getPhrase)("wcf.acl.option.deny");
            Util_1.default.hide(this.#permissionList);
            elementContainer.appendChild(this.#permissionList);
            // prepare search input
            this.#search = new Input_1.default(this.#searchInput, {
                callbackSelect: this.addObject.bind(this),
                includeUserGroups: includeUserGroups,
                preventSubmit: true,
            });
            // bind event listener for submit
            const form = this.#container.closest("form");
            form.addEventListener("submit", this.submit.bind(this));
            // reset ACL on click
            const resetButton = form.querySelector("input[type=reset]");
            resetButton?.addEventListener("click", this.#reset.bind(this));
            if (initialPermissions) {
                this.#success(initialPermissions);
            }
            else {
                this.#loadACL();
            }
        }
        addObject(selectedItem) {
            const type = selectedItem.dataset.type;
            const label = selectedItem.dataset.label;
            const objectId = selectedItem.dataset.objectId;
            const listItem = this.#createListItem(objectId, label, type);
            // toggle element
            this.#savePermissions();
            this.#aclList.closest("li").classList.remove("active");
            listItem.classList.add("active");
            this.#search.addExcludedSearchValues(label);
            // uncheck all option values
            this.#permissionList.closest("input[type=checkbox]").checked = false;
            // clear search input
            this.#searchInput.value = "";
            // show permissions
            Util_1.default.show(this.#permissionList);
            return false;
        }
        submit() {
            this.#savePermissions();
            this.#save("group");
            this.#save("user");
        }
        getData() {
            this.#savePermissions();
            return this.#values;
        }
        #reset() {
            // reset stored values
            this.#values = {
                group: {},
                user: {},
            };
            // remove entries
            this.#aclList.innerHTML = "";
            this.#searchInput.value = "";
            // deselect all input elements
            Util_1.default.hide(this.#permissionList);
            this.#permissionList.querySelector("input[type=checkbox]").checked = false;
        }
        #loadACL() {
            Ajax.apiOnce({
                data: {
                    actionName: "loadAll",
                    className: "wcf\\data\\acl\\option\\ACLOptionAction",
                    parameters: {
                        categoryName: this.#categoryName,
                        objectID: this.#objectID,
                        objectTypeID: this.#objectTypeID,
                    },
                },
                success: (data) => {
                    this.#success(data);
                },
            });
        }
        #createListItem(objectID, label, type) {
            const html = `<fa-icon size="16" name="${type === "group" ? "users" : "user"}" solid></fa-icon>
        <span class="aclLabel">${StringUtil.escapeHTML(label)}</span>
        <button type="button" class="aclItemDeleteButton jsTooltip" title="${(0, Language_1.getPhrase)("wcf.global.button.delete")}">
          <fa-icon size="16" name="xmark" solid></fa-icon>
        </button>`;
            const listItem = document.createElement("li");
            listItem.innerHTML = html;
            this.#aclList.appendChild(listItem);
            listItem.dataset.objectId = objectID;
            listItem.dataset.type = type;
            listItem.dataset.label = label;
            listItem.addEventListener("click", () => {
                if (listItem.classList.contains("active")) {
                    return;
                }
                this.#select(listItem, true);
            });
            const deleteButton = listItem.querySelector(".aclItemDeleteButton");
            deleteButton.addEventListener("click", () => this.#removeItem(listItem));
            return listItem;
        }
        #removeItem(listItem) {
            this.#savePermissions();
            const type = listItem.dataset.type;
            const objectID = listItem.dataset.objectId;
            this.#search.removeExcludedSearchValues(listItem.dataset.label);
            listItem.remove();
            // remove stored data
            if (this.#values[type][objectID]) {
                delete this.#values[type][objectID];
            }
            // try to select something else
            this.#selectFirstEntry();
        }
        #selectFirstEntry() {
            const listItem = this.#aclList.closest("li");
            if (listItem) {
                this.#select(listItem, false);
            }
            else {
                this.#reset();
            }
        }
        #success(data) {
            if (Object.keys(data.returnValues.options).length === 0) {
                return;
            }
            // prepare options
            const structure = {};
            for (const optionID in data.returnValues.options) {
                const option = data.returnValues.options[optionID];
                const listItem = document.createElement("li");
                listItem.innerHTML = `<span>${StringUtil.escapeHTML(option.label)}</span>
        <label for="grant${optionID}" class="jsTooltip" title="${(0, Language_1.getPhrase)("wcf.acl.option.grant")}">
          <input type="checkbox" id="grant' + optionID + '" />
        </label>
        <label for="deny${optionID}" class="jsTooltip" title="${(0, Language_1.getPhrase)("wcf.acl.option.deny")}">
          <input type="checkbox" id="deny${optionID}" />
        </label>`;
                listItem.dataset.optionId = optionID;
                listItem.dataset.optionName = option.optionName;
                const grantPermission = listItem.querySelector(`#grant${optionID}}`);
                const denyPermission = listItem.querySelector(`#deny${optionID}}`);
                grantPermission.dataset.type = "grant";
                grantPermission.dataset.optionId = optionID;
                grantPermission.addEventListener("change", this.#change.bind(this));
                denyPermission.dataset.type = "deny";
                denyPermission.dataset.optionId = optionID;
                denyPermission.addEventListener("change", this.#change.bind(this));
                if (!structure[option.categoryName]) {
                    structure[option.categoryName] = [];
                }
                if (option.categoryName === "") {
                    this.#permissionList.appendChild(listItem);
                }
                else {
                    structure[option.categoryName].push(listItem);
                }
            }
            if (Object.keys(structure).length > 0) {
                for (const categoryName in structure) {
                    const $listItems = structure[categoryName];
                    if (data.returnValues.categories[categoryName]) {
                        $('<li class="aclCategory">' + data.returnValues.categories[categoryName] + "</li>").appendTo(this.#permissionList);
                    }
                    for (let $i = 0, $length = $listItems.length; $i < $length; $i++) {
                        $listItems[$i].appendTo(this.#permissionList);
                    }
                }
            }
            // set data
            this.#parseData(data, "group");
            this.#parseData(data, "user");
            // show container
            Util_1.default.show(this.#container);
            // Because the container might have been hidden before, we must ensure that
            // form builder field dependencies are checked again to avoid having ACL
            // form fields not being shown in form builder forms.
            (0, Manager_1.checkDependencies)();
            // pre-select an entry
            this.#selectFirstEntry();
        }
        #parseData(data, type) {
            if (Object.keys(data.returnValues[type].option).length === 0) {
                return;
            }
            // add list items
            for (const typeID in data.returnValues[type].label) {
                this.#createListItem(typeID, data.returnValues[type].label[typeID], type);
                this.#search.addExcludedSearchValues(data.returnValues[type].label[typeID]);
            }
            // add options
            this.#values[type] = data.returnValues[type].option;
        }
        #select(listItem, savePermissions) {
            // save previous permissions
            if (savePermissions) {
                this.#savePermissions();
            }
            // switch active item
            this.#aclList.closest("li").classList.remove("active");
            listItem.classList.add("active");
            // apply permissions for current item
            this.#setupPermissions(listItem.dataset.type, listItem.dataset.objectId);
        }
        #change(event) {
            const checkbox = event.currentTarget;
            const optionID = checkbox.dataset.optionId;
            const type = checkbox.dataset.type;
            if (checkbox.checked) {
                if (type === "deny") {
                    document.getElementById("#grant" + optionID).checked = false;
                }
                else {
                    document.getElementById("#deny" + optionID).checked = false;
                }
            }
        }
        #setupPermissions(type, objectID) {
            // reset all checkboxes to unchecked
            this.#permissionList.querySelectorAll("input[type='checkbox']").forEach((inputElement) => {
                inputElement.checked = false;
            });
            // use stored permissions if applicable
            if (this.#values[type] && this.#values[type][objectID]) {
                for (const $optionID in this.#values[type][objectID]) {
                    if (this.#values[type][objectID][$optionID] == 1) {
                        $("#grant" + $optionID)
                            .prop("checked", true)
                            .trigger("change");
                    }
                    else {
                        $("#deny" + $optionID)
                            .prop("checked", true)
                            .trigger("change");
                    }
                }
            }
            // show permissions
            Util_1.default.show(this.#permissionList);
        }
        #savePermissions() {
            // get active object
            const activeObject = this.#aclList.querySelector("li.active");
            if (!activeObject) {
                return;
            }
            const objectID = activeObject.dataset.objectId;
            const type = activeObject.dataset.type;
            // clear old values
            this.#values[type][objectID] = {};
            this.#permissionList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
                const optionValue = checkbox.dataset.type === "deny" ? 0 : 1;
                const optionID = checkbox.dataset.optionId;
                if (checkbox.checked) {
                    // store value
                    this.#values[type][objectID][optionID] = optionValue;
                    // reset value afterwards
                    checkbox.checked = false;
                }
                else if (this.#values[type] &&
                    this.#values[type][objectID] &&
                    this.#values[type][objectID][optionID] &&
                    this.#values[type][objectID][optionID] == optionValue) {
                    delete this.#values[type][objectID][optionID];
                }
            });
        }
        #save(type) {
            //TODO change to store as json value in one input
            /*if ($.getLength(this.#values[$type])) {
              const $form = this.#container.parents("form:eq(0)");
        
              for (const $objectID in this.#values[$type]) {
                const $object = this.#values[$type][$objectID];
        
                for (const $optionID in $object) {
                  $(
                    '<input type="hidden" name="' +
                      this.#aclValuesFieldName +
                      "[" +
                      $type +
                      "][" +
                      $objectID +
                      "][" +
                      $optionID +
                      ']" value="' +
                      $object[$optionID] +
                      '" />',
                  ).appendTo($form);
                }
              }
            }*/
        }
    };
});
