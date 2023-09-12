<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Awz\BxApi\Api\Filters\Request\SetFilter;
$arParams['SMART_ID'] = '';
$arParams['GRID_ID'] = 'awz_s__';
$arParams['GRID_OPTIONS'] = [];
$gridId = htmlspecialcharsEx((string) $app->getRequest()->get('grid_id') ?? "");
if(!$gridId) $gridId = htmlspecialcharsEx((string) $app->getRequest()->get('grid') ?? "");
if(isset($placement['grid_id'])){
    $gridId = htmlspecialcharsEx((string) $placement['grid_id'] ?? "");
}
$arParams['GRID_ID'] = $gridId;
$loadParamsEntity = \Awz\Admin\Helper::getGridParams($gridId);
$gridOptions = [];
$preFilter = [];
$h_id = $request->get('h_ID');
if(!$h_id && $placement['HOOK']){
    $h_id = $placement['HOOK'];
}
    //PLACEMENT_OPTIONS
if($h_id){
    $resTokenRight = \Awz\BxApi\Api\Controller\SmartApp::checkUserRightHook(
        $checkAuthDomain, $app->getConfig('APP_ID'), $h_id, $checkAuthMember
    );
    if(!$resTokenRight->isSuccess()){
        $loadParamsEntity->addErrors($resTokenRight->getErrors());
    }else{
        $resGridOptions = $resTokenRight->getData();
        if(isset($resGridOptions['hook']['grid_filter']) && $resGridOptions['hook']['grid_filter']){
            $arParams['GRID_OPTIONS_PREFILTER'] = \Bitrix\Main\Web\Json::decode($resGridOptions['hook']['grid_filter']);
        }
        if(isset($resGridOptions['hook']['ext']) && $resGridOptions['hook']['ext']){
            $app->getRequest()->addFilter(new SetFilter('ext', $resGridOptions['hook']['ext']));
        }
    }
}