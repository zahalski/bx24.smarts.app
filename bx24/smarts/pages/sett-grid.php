<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

use Bitrix\Main\Application;
use Bitrix\Main\Loader;
use Bitrix\Main\Result;
use Bitrix\Main\Error;
use Awz\BxApi\Api\Filters\Request\ParseHook;
use Awz\BxApi\Api\Controller\SmartApp;
use Bitrix\Main\Type\ParameterDictionary;
use Awz\BxApi\Api\Filters\Request\ParseHandler;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension as UIExt;
use Awz\Admin\Grid\Option as GridOptions;

if(!Loader::includeModule('awz.bxapi')){
    return;
}
if(!Loader::includeModule('awz.admin')){
    return;
}

$tracker = null;
if(Loader::includeModule('awz.bxapistats')){
    $tracker = \Awz\BxApiStats\Tracker::getInstance();
    $tracker->addCount();
}
$request = Application::getInstance()->getContext()->getRequest();
$pageResult = new Result();

$gridOptions = new GridOptions($request->get('grid_id'));
$loadParamsEntity = \Awz\Admin\Helper::getGridParams($request->get('grid_id'));
$loadParamsEntityData = null;
$hookListResult = null;
$hookListOptions = [];
if(!$loadParamsEntity->isSuccess()){
    $pageResult->addErrors($loadParamsEntity->getErrors());
}else{
    $loadParamsEntityData = $loadParamsEntity->getData();
    $hookListOptions = $loadParamsEntityData['options'];
}

$isCustomPage = false;
if(isset($hookListOptions['PARAM_1'], $hookListOptions['PARAM_2']) &&
    $hookListOptions['PARAM_1'] === 'APP_LINK' &&
    $hookListOptions['PARAM_2'] === 'APP_LINK')
{
    $isCustomPage = true;
}

if($isCustomPage){
    $hookListData = [];
    $controller = new SmartApp();
    $hookListResult = $controller->run(
        'listhook',
        [new ParameterDictionary($request->getValues())]
    );
    if($controller->getErrors()){
        $pageResult->addErrors($controller->getErrors());
    }else{
        foreach($hookListResult as $hookData){
            $hookListData[$hookData['ID']] = SmartApp::getPageParam($hookData);
        }

    }
}

//echo'<pre>';print_r($gridOptions->getCurrentOptions());echo'</pre>';
//echo'<pre>';print_r($loadParamsEntityData);echo'</pre>';
//echo'<pre>';print_r($hookListResult);echo'</pre>';

$fraimeType = '';
if($request->get('IFRAME_TYPE')){
    $fraimeType = 'slide_'.preg_replace('/([^0-9a-z_\-])/is','',strtolower($request->get('IFRAME_TYPE')));
}
?><?if(!$request->get('html')){?><!DOCTYPE html>
<html lang="ru">
<head>
    <?
    CJsCore::init('jquery');
    Asset::getInstance()->addCss("/bitrix/css/main/bootstrap.css");
    Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
    Asset::getInstance()->addCss("/bx24/smarts/style.css");
    Asset::getInstance()->addJs("/bx24/smarts/scriptn.js");
    UIExt::load("ui.buttons");
    UIExt::load("ui.buttons.icons");
    UIExt::load("ui.alerts");
    UIExt::load("ui.forms");
    UIExt::load("ui.layout-form");
    UIExt::load('ui.entity-selector');
    ?>
    <?$APPLICATION->ShowHead()?>
</head>
<body class="<?=$fraimeType?>"><div class="workarea">
<div class="container"><div class="row"><div class="result-block-messages"></div></div></div>
<?}?>
<?php

if($pageResult->isSuccess()){
?>
    <div class="appWrap" data-page="grid-sett">
        <div class="container"><div class="row"><div class="ui-block-wrapper">
                    <div class="ui-block-title">
                        <div class="ui-block-title-text">Настройки грида</div>
                        <div class="ui-block-title-actions">
                            <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
                        </div>
                    </div>
                    <div class="ui-block-content active">
                        <form id="custom-user-grid-sett">
                        <div class="container"><div class="row"><div class="col-xs-12">

                        </div></div></div>

                        <div class="container">

                            <?
                            if($isCustomPage){
                                $currentGridOptions = $gridOptions->getCustomOptions()->getParameter('pages', []);
                                $options = \Awz\Admin\Helper::applyGridOptionsToCustomGrid($hookListData, $currentGridOptions);
                                //echo'<pre>';print_r($options);echo'</pre>';
                                ?>
                                <?foreach($options as $pageId=>$pageData){?>
                            <div class="ui-form ui-form-section">
                                <div class="row" style="margin:0;padding:15px 0 0 0;">
                                <div data-type="awz_placementlist" data-id="<?=$pageId?>" class="awz-autoload-field awz-autoload-awz_placementlist-<?=$pageId?>"><?=$pageId?></div>
                                </div>

                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-ctl ui-ctl-checkbox ui-ctl-w100">
                                        <input type="checkbox" name="params[pages][<?=$pageId?>][active]" value="Y" class="ui-ctl-element"<?=($pageData['active']=='Y' ? 'checked="checked"' : '')?>>
                                        <div class="ui-ctl-label-text">Активность</div>
                                    </div>
                                </div>

                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Название встройки</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                        <input type="text" name="params[pages][<?=$pageId?>][min_name_user]" class="ui-ctl-element" value="<?=htmlspecialcharsEx($pageData['min_name_user'])?>" placeholder="Введите текст">
                                    </div>
                                </div>

                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Описание встройки</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                        <input type="text" name="params[pages][<?=$pageId?>][desc_user]" class="ui-ctl-element" value="<?=htmlspecialcharsEx($pageData['desc_user'])?>" placeholder="Введите текст">
                                    </div>
                                </div>
                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Ссылка на иконку</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                        <input type="text" name="params[pages][<?=$pageId?>][desc_icon]" class="ui-ctl-element" value="<?=htmlspecialcharsEx($pageData['desc_icon'])?>" placeholder="Введите текст">
                                    </div>
                                </div>
                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Цвет фона пункта меню (HEX)</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                        <input type="text" name="params[pages][<?=$pageId?>][desc_bg_hex]" class="ui-ctl-element" value="<?=htmlspecialcharsEx($pageData['desc_bg_hex'])?>" placeholder="Введите код цвета">
                                    </div>
                                </div>
                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Сортировка</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                        <input type="text" name="params[pages][<?=$pageId?>][sort]" class="ui-ctl-element" value="<?=htmlspecialcharsEx($pageData['sort'])?>" placeholder="Введите число">
                                    </div>
                                </div>

                            </div>
                                    <script>
                                        window.AwzBx24EntityLoader_ob.load();
                                    </script>
                                <?}?>
                                <?
                            }else{
                                ?>
                                <div class="ui-alert ui-alert-warning awz-save-hook-params-empty">
                                        <span class="ui-alert-message">
                                        Тут пока нет специальных настроек
                                        </span>
                                </div>
                                <?
                            }
                            ?>

                        <div class="ui-form ui-form-section">


                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="err-rows-sett"></div>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <a href="#" id="awz-save-grid-sett" class="ui-btn ui-btn-success ui-btn-icon-success">Сохранить</a>
                            </div>
                        </div>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?//echo'<pre>';print_r($hookResult);echo'<pre>';?>

    <?
}else{
    echo \Awz\BxApi\Helper::errorsHtml($pageResult, 'Ошибка');
}

//echo'<pre>';print_r($controller->getErrors());echo'</pre>';
//echo'<pre>';print_r($hookResult);echo'</pre>';
?>
<?if(!$request->get('html')){?>
</div>
</body></html>
<?}?>
<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");