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
$fraimeType = '';
if($request->get('IFRAME_TYPE')){
    $fraimeType = 'slide_'.preg_replace('/([^0-9a-z_\-])/is','',strtolower($request->get('IFRAME_TYPE')));
}
$pageResult = new Result();
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
        <style>
            .item-contact {display:block;text-align:center;margin:1em 0 3em 0;}
            .item-contact .title {color:#091b5b;font-weight:bold;font-size: 1.4em;}
            .item-contact .image {font-size:60px;padding:20px 0;color:#091b5b;}
            .item-contact .name a {color:#DA0000;font-weight:bold;font-size: 1.3em;
                text-decoration:none;
            }
            .item-contact .name a:hover {color:#091b5b;}

        </style>
    <div class="row">

        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="item-contact">
                <div class="title">Telegram</div>
                <div class="image">
                    <span class="fa fa-comments-o"></span>
                </div>
                <div class="name">
                    <a target="_blank" href="https://t.me/andrew_zahalski">@andrew_zahalski</a>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="item-contact">
                <div class="title">Email</div>
                <div class="image"><i class="fa fa-envelope"></i></div>
                <div class="name">
                    <a target="_blank" href="mailto:info@zahalski.dev">info@zahalski.dev</a>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-4 col-sm-6">
            <div class="item-contact">
                <div class="title">Поддержка решений</div>
                <div class="image"><i class="fa fa-comments"></i></div>
                <div class="name">
                    <a target="_blank" href="https://zahalski.bitrix24.by/online/opensource">Online чат</a>
                </div>
            </div>
        </div>

    </div>
    <div class="row">
        <div class="col-xs-12">
        <h2>Документация</h2>
        </div>
        <div class="col-xs-12">
        <p>
            <a target="_blank" href="https://zahalski.dev/modules/awz.smartbag/menu_actions/">Свои страницы с пунктами меню для быстрого перехода</a>
        </p>
        <p>
            <a target="_blank" href="https://zahalski.dev/modules/awz.smartbag/group_actions/">Свои групповые действия в гридах (списках)</a>
        </p>
        </div>
    </div>
    <script>
        if(!window.AwzBx24PageManager_ob){
            var pagesManager = new AwzBx24PageManager();
            pagesManager.init();
        }
    </script>
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