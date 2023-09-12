<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Bitrix\Main\Page\Asset;
global $APPLICATION;
?><!DOCTYPE html>
<html lang="ru">
<head>
    <?
    if($checkAuth){
        CJSCore::Init(array('jquery', 'popup', 'date', 'sidepanel'));
        Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
        Asset::getInstance()->addJs("/bx24/smarts/scriptn.js");
        Asset::getInstance()->addJs("/bx24/smarts/md5.js");
    }
    Asset::getInstance()->addCss("/bx24/smarts/style.css");
    ?>
    <?if($checkAuth){?>
        <script type="text/javascript">
            window.awz_ajax_proxy = {
                UpdatePageData:  function(proxyContent){
                    BX.ajax.UpdatePageData(proxyContent);
                }
            };
        </script>
        <script src="//api.bitrix24.com/api/v1/"></script>
    <?}?>
    <?$APPLICATION->ShowHead()?>
</head>
<body>