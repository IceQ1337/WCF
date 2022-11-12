<?php

namespace wcf\system\language\preload\command;

use wcf\data\language\Language;

/**
 * Resets the preload cache for the requested language.
 *
 * @author Alexander Ebert
 * @copyright 2001-2022 WoltLab GmbH
 * @license GNU Lesser General Public License <http://opensource.org/licenses/lgpl-license.php>
 * @package WoltLabSuite\Core\System\Language\Preload\Command
 * @since 6.0
 */
final class ResetPreloadCache
{
    private readonly Language $language;

    public function __construct(Language $language)
    {
        $this->language = $language;
    }

    public function __invoke(): void
    {
        // Try to remove the file if it exists.
        @\unlink(\WCF_DIR . $this->language->getPreloadCacheFilename());
    }
}
