<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
/* @var \Bitrix\Main\Result $loadParamsEntity */
if($loadParamsEntity->isSuccess()){
    $loadParamsEntityData = $loadParamsEntity->getData();
    $gridOptions = $loadParamsEntityData['options'];
    $arParams['SMART_ID'] = $gridOptions['PARAM_1'] ?? "";

    $ents = AwzSmartEntities::getInstance();

    $arParams['GRID_OPTIONS'] = $gridOptions;
    //echo'<pre>';print_r($arParams['GRID_OPTIONS']);echo'</pre>';
    if($arParams['SMART_ID'] === 'TASK_USER_CRM'){
        if(empty($arParams['GRID_OPTIONS_PREFILTER']) && $gridOptions['PARAM_2']){
            if(isset($placement['ID']) && $placement['ID']){
                $arParams['SMART_ID'] = 'TASK_USER';
                $arParams['GRID_OPTIONS']['PARAM_1'] = 'TASK_USER';
                $smartCode = $ents->getCodeFromSmartId($gridOptions['PARAM_2']);
                $currentEntity = $ents->setEntityFromCode($smartCode, $arParams['SMART_ID']);
                $arParams['GRID_OPTIONS_PREFILTER'] = [
                    'UF_CRM_TASK'=>$currentEntity->getParam('min_code').'_'.$placement['ID']
                ];
                $gridOptions = $arParams['GRID_OPTIONS'];
            }
        }
        //print_r($arParams['GRID_OPTIONS_PREFILTER']);
    }

    $smartCode = $ents->getCodeFromSmartId($arParams['SMART_ID']);
    if($arParams['SMART_ID']) $arParams['SMART_ID'] = str_replace($smartCode.'_','',$arParams['SMART_ID']);
    $currentEntity = $ents->setEntityFromCode($smartCode, $arParams['SMART_ID']);
    if($currentEntity){
        $currentEntity->applyParams(
            $arParams['GRID_OPTIONS'],
            ['method_list','method_delete','method_update','method_add','result_key','method_fields','search_key']
        )->applyParam($arParams, 'EXT_PARAMS');
        $externalDomain = $currentEntity->getParam('externalDomain', '');
    }else{
        $loadParamsEntity->addError(new \Bitrix\Main\Error('Ошибка загрузки параметров сущности '.$smartCode));
    }
    //print_r($currentEntity);
    //print_r($arParams);
}