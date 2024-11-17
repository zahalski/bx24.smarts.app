<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Awz\BxApi\Helper;
if(!$loadParamsEntity->isSuccess()) $arParams['SMART_ID'] = '';
if(!$arParams['SMART_ID'] && !$customPrint){
    $loadParamsEntity->addError(new \Bitrix\Main\Error("Сущность не найдена"));
    ?>
    <div class="container"><div class="row"><div class="ui-block-wrapper">
                <?
                echo Helper::errorsHtmlFromText(
                    $loadParamsEntity->getErrorMessages(),
                    'Ошибка получения сущности');?>
            </div></div></div>
    <?
}