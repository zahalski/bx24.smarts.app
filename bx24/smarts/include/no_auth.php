<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Awz\BxApi\Helper;
?>
    <div class="container"><div class="row"><div class="ui-block-wrapper">
                <?
                echo Helper::errorsHtmlFromText(
                    array(
                        'Проверка авторизации провалена'),
                    'Ошибка получения опций приложения');?>
            </div></div></div>
<?