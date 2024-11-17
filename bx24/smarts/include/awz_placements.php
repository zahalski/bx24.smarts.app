<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
require_once('options_const.php');
use Awz\BxApi\Api\Controller\SmartApp;
use Bitrix\Main\Type\ParameterDictionary;

/* @var $loadParamsEntity \Bitrix\Main\Result */
/* @var $app \Awz\BxApi\App */
$allParamsPortalData = [];
if($loadParamsEntity->isSuccess()){
    $allParamsPortal = AwzSmartEntities::getPortalParameters($app);
    if($allParamsPortal->isSuccess()){
        $allParamsPortalData = $allParamsPortal->getData();
        $allParamsPortalData = $allParamsPortalData['result'];
    }else{
        $loadParamsEntity->addErrors($allParamsPortal->getErrors());
    }
}
if($loadParamsEntity->isSuccess()){
    //string $domain, string $app, int $userId, $isAdmin, int $publicmode=0, int $parentplacement = 0, string $grid_id='', string $key='', int $check_active=0
    $controller = new SmartApp();
    $controller->enableAction('listhookapp');
    /* публичные данные гридов с проверкой на права доступа к ним пользователю, нам нужны имена сущностей и идшники для получения доп настроек */
    $hookResult = $controller->run(
        'listhookapp',
        [new ParameterDictionary([
            'domain'=>$checkAuthDomain,
            'app'=>$app->getConfig('APP_ID'),
            'userId'=>$checkAuthMember,
            'isAdmin'=>0,
            'publicmode'=>1,
            //'grid_id'=>$arParams['GRID_ID'],
        ])]
    );
    if($controller->getErrors()){
        $loadParamsEntity->addErrors($controller->getErrors());
    }
    $activeHookIds = [];
    if(is_array($hookResult)){
        $activeHookIds = array_keys($hookResult);
    }
    if(!empty($activeHookIds)){
        $ents = AwzSmartEntities::getInstance();
        $r = \Awz\BxApi\HandlersTable::getList([
            'select'=>['*'],
            'filter'=>[
                '=PORTAL'=>$checkAuthDomain,
                '=ID'=>$activeHookIds
            ]
        ]);
        while($data = $r->fetch()){
            $ents->addUserHookEntity($data, $hookResult[$data['ID']]);
        }
    }
    $controller->disableAction('listhookapp');
    $ents = AwzSmartEntities::getInstance()->getHookEntities();
    if(!isset($arParams['JS_ENTITIES'])) $arParams['JS_ENTITIES'] = [];
    /* @var $ent AwzSmartEntityParam */
    $smartCodes = [];
    $rpaCodes = [];
    $listsCodes = [];
    foreach($ents as $ent){
        $jsOpts = $ent->getParam('jsOptions');
        if($jsOpts['parent_alias'] && mb_strpos($jsOpts['parent_alias'], 'DYNAMIC_')!==false){
            $smartCodes[] = str_replace('DYNAMIC_','',$jsOpts['parent_alias']);
        }elseif($jsOpts['parent_alias'] && mb_strpos($jsOpts['parent_alias'], 'RPA_')!==false){
            $rpaCodes[] = str_replace('RPA_','',$jsOpts['parent_alias']);
        }elseif($jsOpts['parent_alias'] && mb_strpos($jsOpts['parent_alias'], 'LISTS_LISTS_')!==false){
            $listsCodes[] = str_replace('LISTS_LISTS_','',$jsOpts['parent_alias']);
        }
        $arParams['JS_ENTITIES'][$ent->getParam('code')] = $ent->getParam('entity_options');
    }
    if(!empty($smartCodes)){
        foreach($allParamsPortalData['smarts'] as $smartData){
            if(in_array($smartData['entityTypeId'], $smartCodes)){
                $arParams['JS_ENTITIES']['eval_DYNAMIC'.$smartData['entityTypeId']] = \CUtil::phpToJsObject([
                    'type'=>['entityTypeId'=>$smartData['entityTypeId'],'title'=>$smartData['title']],
                    'key'=>''
                ]);
            }
        }
    }
    if(!empty($rpaCodes)){
        foreach($allParamsPortalData['rpa'] as $smartData){
            if(in_array($smartData['id'], $rpaCodes)){
                $arParams['JS_ENTITIES']['eval_RPA'.$smartData['id']] = \CUtil::phpToJsObject([
                    'type'=>['entityTypeId'=>$smartData['id'],'title'=>$smartData['title']],
                    'key'=>'rpa'
                ]);
            }
        }
    }
    if(!empty($listsCodes)){
        foreach($allParamsPortalData['listslists'] as $smartData){
            if(in_array($smartData['ID'], $listsCodes)){
                $arParams['JS_ENTITIES']['eval_IB'.$smartData['ID']] = \CUtil::phpToJsObject([
                    'type'=>['ID'=>$smartData['ID'],'NAME'=>$smartData['NAME']],
                    'key'=>'lists'
                ]);
            }
        }
    }

    //echo'<pre>';print_r($rpaCodes);echo'</pre>';
    //echo'<pre>';print_r($arParams['JS_ENTITIES']);echo'</pre>';
    //echo'<pre>';print_r($allParamsPortalData);echo'</pre>';
}