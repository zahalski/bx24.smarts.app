<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Awz\BxApi\TokensTable;
use Awz\BxApi\Api\Filters\Request\SetFilter;

$arParams['ADD_REQUEST_KEY'] = $checkAuthKey.'|'.$checkAuthDomain.'|'.$checkAuthMember.'|'.$app->getConfig('APP_ID');
$arParams['CURRENT_USER'] = $checkAuthMember;
$hash = hash_hmac('sha256', $arParams['ADD_REQUEST_KEY'], $app->getConfig('APP_SECRET_CODE'));
$arParams['ADD_REQUEST_KEY'] .= '|'.$hash;
$app->getRequest()->addFilter(new SetFilter('key', $arParams['ADD_REQUEST_KEY']));

if($tracker){
    $tracker->setPortal($checkAuthDomain)
        ->setAppId($app->getConfig('APP_ID'));
}
if(isset($arParams['EXT_PARAMS'])){
    $arParams['GRID_OPTIONS_EXT_PARAMS'] = $arParams['EXT_PARAMS'];
}
if(isset($arParams['GRID_OPTIONS']['g'])){
    $arParams['GRID_OPTIONS_g'] = $arParams['GRID_OPTIONS']['g'];
}
//print_r($arParams['GRID_OPTIONS']);
$cacheId = $app->getRequest()->get('DOMAIN').'fields_bagsmart_'.md5(serialize($arParams['GRID_OPTIONS']));
$cacheKey = 0;
$auth = TokensTable::getList(array(
    'select'=>array('*'),
    'filter'=>array('=PORTAL'=>$app->getRequest()->get('DOMAIN'), '=APP_ID'=>$app->getConfig('APP_ID'))
))->fetch();
if(!isset($auth['TOKEN'])){
    $loadParamsEntity->addError(new \Bitrix\Main\Error("Токен приложения не найден"));
}else{
    $app->setAuth($auth['TOKEN']);
}

if($loadParamsEntity->isSuccess()){
    $checkResult = $app->getRequest()->get('bx_result');
    if($checkResult['cache_action'] == 'remove'){
        $app->cleanCache($cacheId);
        for($i=0;$i<10;$i++){
            $app->cleanCache($cacheId.'_'.$i);
        }
    }
    if($checkResult['bxTime'] && $tracker){
        $tracker->addBxTime($checkResult['bxTime']);
    }
}