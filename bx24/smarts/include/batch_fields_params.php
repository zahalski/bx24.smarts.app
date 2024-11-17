<?php

use Awz\BxApi\OptionsTable;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
$batchAr = \Awz\Admin\Helper::prepareCrmDataFields($allFields, $batchAr);
//echo'<pre>';print_r($batchAr);echo'</pre>';
if(class_exists('WorksList')){
    foreach($allFields as $fieldCode=>$field){
        $batchKey = mb_strtolower('WorksList_'.$fieldCode);
        if($fieldCode == 'STATUS'){
            $batchAr[$batchKey] = ['method'=>'crm.enum.activitystatus', 'params'=> []];
        }elseif($fieldCode == 'OWNER_TYPE_ID'){
            $batchAr[$batchKey] = ['method'=>'crm.enum.ownertype', 'params'=> []];
        }elseif($fieldCode == 'TYPE_ID'){
            $batchAr[$batchKey] = ['method'=>'crm.enum.activitytype', 'params'=> []];
        }elseif($fieldCode == 'PRIORITY'){
            $batchAr[$batchKey] = ['method'=>'crm.enum.activitypriority', 'params'=> []];
        }elseif($fieldCode == 'DIRECTION'){
            $batchAr[$batchKey] = ['method'=>'crm.enum.activitydirection', 'params'=> []];
        }
    }
    $batchAr['workslist_crm_type_list'] = ['method'=>'crm.type.list', 'params'=> []];
}

$cacheNums = ceil(count($batchAr)/50);
$cacheIds = [];
while($cacheNums > 0){
    $cacheNums = $cacheNums-1;
    $cacheKey++;
    $cacheIds[] = $cacheId.'_'.$cacheKey;
}
$external = '';
$externalDomain = '';
if(!empty($arParams['EXT_PARAMS'])){
    $external = $arParams['EXT_PARAMS'][1];
    $externalDomain = preg_replace('/([^\/]+\/\/[^\/]+)\/.*/is',"$1",$external);
}
$batchRes = $app->callBatch($batchAr, $cacheIds, $external);
if($batchRes->isSuccess()){
    $batchResData = $batchRes->getData();
    $batchResData = $batchResData['result'];
}
foreach($allFields as $fieldCode=>&$field){
    if($field['type']=='url' && (!isset($field['settings']['domain']) || empty($field['settings']['domain']))){
        if(!isset($field['settings'])){
            $field['settings'] = [];
        }
        $field['settings']['domain'] = $externalDomain ? $externalDomain : $checkAuthDomain;
    }
    if(class_exists('WorksList')) {
        $batchKey = mb_strtolower('WorksList_' . $fieldCode);
        if(in_array($fieldCode,
            ['STATUS','OWNER_TYPE_ID','TYPE_ID','PRIORITY','DIRECTION'])
        ){
            $statusEnumResData = $batchResData[$batchKey];
            $field['values'] = [];
            $field['type'] = 'enum';
            foreach($statusEnumResData as $stage){
                if($stage['ID'])
                    $field['values'][$stage['ID']] = $stage['NAME'];
            }
        }
    }
    if($field['type'] == 'char') {
        $field['type'] = 'enum';
        $field['values'] = ['Y'=>'да','N'=>'нет'];
    }
    if($field['type'] == 'crm_currency'){
        $values = [''=>'Не указано'];
        $batchKey = mb_strtolower($field['type']);
        if(isset($batchResData[$batchKey]) && is_array($batchResData[$batchKey])){
            foreach($batchResData[$batchKey] as $stageData){
                $values[$stageData['CURRENCY']] = $stageData['FULL_NAME'];
            }
        }
        if(count($values)>1)
            $field['values'] = $values;
    }
    if($field['type'] == 'crm_status' &&
        strpos($field['statusType'],'RPA_')===false)
    {
        $values = [''=>'Не указано'];
        $batchKey = mb_strtolower($field['statusType']);
        if(isset($batchResData[$batchKey]) && is_array($batchResData[$batchKey])){
            foreach($batchResData[$batchKey] as $stageData){
                $values[$stageData['STATUS_ID']] = $stageData['NAME'];
            }
        }
        $field['values'] = $values;
    }
    if($field['type'] == 'group')
    {
        $values = [''=>'Не указано'];
        $batchKey = mb_strtolower('groups');
        if(isset($batchResData[$batchKey]) && is_array($batchResData[$batchKey])){
            foreach($batchResData[$batchKey] as $stageData){
                $values[$stageData['ID']] = $stageData['NAME'];
            }
        }
        $field['items'] = $values;
    }
    if(isset($field['upperName']) && $field['upperName'] &&
        in_array($field['upperName'], ['TAX_VALUE','OPPORTUNITY']) ||
        in_array($fieldCode, ['TAX_VALUE','OPPORTUNITY']) ||
        ($field['type'] == 'money')
    ){
        $batchKey = 'crm_currency';
        $values = [];
        if(isset($batchResData[$batchKey]) && is_array($batchResData[$batchKey])){
            foreach($batchResData[$batchKey] as $stageData){
                $stageData['FORMAT_STRING'] = str_replace('#', '##', $stageData['FORMAT_STRING']);
                $stageData['FORMAT_STRING'] = str_replace('&##', '&#', $stageData['FORMAT_STRING']);
                $values[$stageData['CURRENCY']] = $stageData['FORMAT_STRING'];
            }
        }
        if(count($values)>0)
            $field['values_format'] = $values;
    }
    if($field['type']=='crm_entity' && isset($field['settings']['parentEntityTypeId'])){
        $codesEntity = \Awz\BxApi\Helper::entityCodes();
        foreach($codesEntity as $ent){
            if($ent['ID'] == $field['settings']['parentEntityTypeId']){
                $field['type'] = 'crm_'.mb_strtolower($ent['CODE']);
                break;
            }
        }
        if($field['type']=='crm_entity'){
            $field['type'] = 'crm';
            $field['settings'] = [
                'DYNAMIC_'.$field['settings']['parentEntityTypeId'] => 'Y'
            ];
        }
    }
    if($field['type']=='crm' && isset($field['settings']) && is_array($field['settings'])){
        $codes = [];
        foreach($field['settings'] as $code=>$act){
            if($act === 'Y'){
                if(in_array($code, ['COMPANY','DEAL','LEAD','CONTACT', 'INVOICE', 'QUOTE', 'REQUISITE', 'SMART_INVOICE'])){
                    $codes[] = $code;
                }
            }
        }
        if(count($codes) == 1){
            $field['type'] = 'crm_'.mb_strtolower($codes[0]);
        }
    }
    if(mb_strpos($field['type'], 'awzuientity')!==false){

        $key = md5(serialize(['crm',$fieldCode]));
        $res = OptionsTable::getList([
            'select'=>['PARAMS'],
            'filter'=>[
                '=APP'=>$app->getConfig('APP_ID'),
                '=PORTAL'=>$checkAuthDomain,
                '=NAME'=>$key
            ],
            'limit'=>1
        ])->fetch();
        //echo'<pre>';print_r($res);echo'</pre>';
        if($res && isset($res['PARAMS']['hooks']) && !empty($res['PARAMS']['hooks'])){
            $field['type'] = 'awzuientity';
            $field['settings'] = [];
            foreach(explode(',', $res['PARAMS']['hooks']) as $hook){
                $field['settings'][$hook] = 'Y';
            }
        }
        //
    }
}
unset($field);