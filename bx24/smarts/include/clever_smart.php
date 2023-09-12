<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
$cacheIdCS = $app->getRequest()->get('DOMAIN').'_fields_bagsmart_clever_smart';
$checkResult = $app->getRequest()->get('bx_result');
if($checkResult['cache_action'] == 'remove'){
    $app->cleanCache($cacheIdCS.'_1');
    $app->cleanCache($cacheIdCS.'_2');
}
$app->setCacheParams($cacheIdCS.'_1');
$bxRowsResActions = $app->postMethod('crm.type.list', ['filter'=>['title'=>'Умный смарт']]);
if($bxRowsResActions->isSuccess()){
    $bxActions = $bxRowsResActions->getData();
    if(isset($bxActions['result']['result']['types'][0]['id'])){
        $app->setCacheParams($cacheIdCS.'_2');
        $bxRowsResActionsFields = $app->postMethod('crm.item.fields', ['entityTypeId'=>$bxActions['result']['result']['types'][0]['entityTypeId']]);
        if($bxRowsResActionsFields->isSuccess()){
            $bxActionsFields = $bxRowsResActionsFields->getData();
            if(!empty($bxActionsFields['result']['result']['fields'])){
                $arParams['CLEVER_FIELDS'] = $bxActionsFields['result']['result']['fields'];
                $arParams['CLEVER_SMART'] = $bxActions['result']['result']['types'][0];
            }
        }else{
            $app->cleanCache($cacheIdCS.'_2');
        }
    }
}else{
    $app->cleanCache($cacheIdCS.'_1');
}