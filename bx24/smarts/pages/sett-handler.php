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
$request->addFilter(new ParseHandler('bxhandler','id','hash'));
$controller = new SmartApp();
$hookResult = $controller->run(
    'gethook',
    [new ParameterDictionary($request->getValues())]
);
if($hookResult){
    if(!isset($hookResult['PARAMS']['hook'])){
        $hookResult['PARAMS']['hook'] = [];
    }
    if(!isset($hookResult['PARAMS']['hook']['users'])){
        $hookResult['PARAMS']['hook']['users'] = [];
    }
}
$checkAuth = $controller->getScopeCollection()->getByCode('user')->getStatus() === 'ok';
$pageResult = new Result();
if(!$checkAuth){
    $pageResult->addError(new Error('Ошибка авторизации'));
}elseif(!$hookResult){
    $pageResult->addError(new Error('Обработчик не зарегистрирован'));
}
if($checkAuth){
    if($controller->getErrors()){
        $pageResult->addErrors($controller->getErrors());
    }
}
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
    <div class="appWrap" data-page="hook-sett">
        <div class="container"><div class="row"><div class="ui-block-wrapper">
                    <div class="ui-block-title">
                        <div class="ui-block-title-text">Настройки прав доступа к обработчику</div>
                        <div class="ui-block-title-actions">
                            <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
                        </div>
                    </div>
                    <div class="ui-block-content active">
                        <div class="container">
                            <div class="row" style="margin:0;padding:15px 0 15px 0;">
                                <div data-type="awz_placementlist" data-id="<?=$hookResult['ID']?>" class="awz-autoload-field awz-autoload-awz_placementlist-<?=$hookResult['ID']?>"><?=$hookResult['ID']?></div>
                            </div>
                            <div class="row"><div class="col-xs-12">
                                <?
                                $addStyle = '';
                                if(!empty($hookResult['PARAMS']['hook']['users'])){
                                    $addStyle = ' style="display:none;"';
                                    ?>
                                    <div class="container" style="margin-bottom:15px;">
                                        <div class="row"><h4>Пользователи с доступом к обработчику во встройке: </h4></div>
                                        <div class="row"><div class="awz-save-hook-params-users">
                                        <?foreach($hookResult['PARAMS']['hook']['users'] as $userId){?>
                                            <div data-type="awz_user" data-id="<?=$userId?>" class="awz-autoload-field awz-autoload-awz_user-<?=$userId?>"><?=$userId?></div>
                                        <?}?>
                                        </div></div>
                                    </div>

                                <?}?>
                                    <div <?=$addStyle?>class="ui-alert ui-alert-warning awz-save-hook-params-empty">
                                        <span class="ui-alert-message">
                                        <strong>Внимание!</strong> Встройка может быть открыта любым пользователем.
                                        </span>
                                    </div>
                        </div></div></div>

                                <?
                                if(!empty($hookResult['PARAMS']['hook']['placements'])){
                                    ?>
                                    <div class="container"><div class="row"><div class="col-xs-12">
                                    <div class="container" style="margin-bottom:15px;">
                                        <div class="row"><h4>Встройки доступные во встройке: </h4></div>
                                        <div class="row"><div class="awz-save-hook-params-users">
                                        <?foreach($hookResult['PARAMS']['hook']['placements'] as $userId){?>
                                            <div data-type="awz_placementlist" data-id="<?=$userId?>" class="awz-autoload-field awz-autoload-awz_placementlist-<?=$userId?>"><?=$userId?></div>
                                        <?}?>
                                        </div></div>
                                    </div>

                                </div></div></div>
                                <?}?>


                        <div class="container">
                        <div class="ui-form ui-form-section">

                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Пользователи</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100" id="users-right-block">
                                    <input type="text" id="users-right" class="ui-ctl-element" value="<?=implode(',',$hookResult['PARAMS']['hook']['users'])?>" placeholder="Выберите пользователей">
                                </div>
                                <a style="float:left;" onclick="window.awz_helper.openDialogAwzCrm('users-right-block','awz_user,awz_employee', 'Y');return false;" class="ui-btn ui-form-link" href="#">выбрать ...</a>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Описание встройки для админа</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                    <input type="text" id="placement-desc-admin" class="ui-ctl-element" value="<?=htmlspecialcharsEx($hookResult['PARAMS']['hook']['desc_admin'])?>" placeholder="Введите текст">
                                </div>
                            </div>
                            <?if(!$hookResult['PARAMS']['hook']['min_name_user']){
                                $hookResult['PARAMS']['hook']['min_name_user'] = $hookResult['PARAMS']['handler']['name'];
                            }?>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Название встройки для пользователей в списке</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                    <input type="text" id="placement-min-name-user" class="ui-ctl-element" value="<?=htmlspecialcharsEx($hookResult['PARAMS']['hook']['min_name_user'])?>" placeholder="Введите текст">
                                </div>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Описание встройки для пользователей в списке</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                    <input type="text" id="placement-desc-user" class="ui-ctl-element" value="<?=htmlspecialcharsEx($hookResult['PARAMS']['hook']['desc_user'])?>" placeholder="Введите текст">
                                </div>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Ссылка на изображение иконки</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                    <input type="text" id="placement-icon-user" class="ui-ctl-element" value="<?=htmlspecialcharsEx($hookResult['PARAMS']['hook']['desc_icon'])?>" placeholder="Введите текст">
                                </div>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="ui-form-label">
                                    <div class="ui-ctl-label-text">Цвет фона пункта меню (HEX)</div>
                                </div>
                                <div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
                                    <input type="text" id="placement-icon-hex" class="ui-ctl-element" value="<?=htmlspecialcharsEx($hookResult['PARAMS']['hook']['desc_bg_hex'])?>" placeholder="Введите код цвета">
                                </div>
                            </div>
                            <?if(isset($hookResult['PARAMS']['handler']['type']) &&
                                $hookResult['PARAMS']['handler']['type'] == 'REST_APP_WRAP'){
                                if(!isset($hookResult['PARAMS']['hook']['placements']))
                                    $hookResult['PARAMS']['hook']['placements'] = [];
                                ?>
                                <div class="ui-form-row ui-form-row-middle-input">
                                    <div class="ui-form-label">
                                        <div class="ui-ctl-label-text">Встройки доступные внутри встройки</div>
                                    </div>
                                    <div class="ui-ctl ui-ctl-textbox ui-ctl-w100" id="placements-list-right-block">
                                        <input type="text" id="placements-list" class="ui-ctl-element" value="<?=implode(",",$hookResult['PARAMS']['hook']['placements'])?>" placeholder="Выберите встройки">
                                    </div>
                                    <a style="float:left;" onclick="window.awz_helper.openDialogAwzCrm('placements-list-right-block','awz_placementlist', 'Y');return false;" class="ui-btn ui-form-link" href="#">выбрать ...</a>
                                </div>
                            <?}?>


                            <div class="ui-form-row ui-form-row-middle-input">
                                <div class="err-rows-sett"></div>
                            </div>
                            <div class="ui-form-row ui-form-row-middle-input">
                                <a href="#" data-id="<?=$hookResult['ID']?>" data-hash="<?=$hookResult['HASH']?>" id="awz-save-hook-params" class="ui-btn ui-btn-success ui-btn-icon-success">Сохранить</a>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        window.AwzBx24EntityLoader_ob.load();
    </script>
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