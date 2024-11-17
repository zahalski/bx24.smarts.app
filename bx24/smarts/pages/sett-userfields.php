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
use Bitrix\Main\Security;

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
$controller = new SmartApp();
$hookResult = $controller->run(
    'listhook',
    [new ParameterDictionary($request->getValues())]
);
$ufResult = $controller->run(
    'userfields',
    [new ParameterDictionary($request->getValues())]
);
if($hookResult){

    foreach($hookResult as &$hook){
        $isGrid = false;

        if(!isset($hook['PARAMS']['hook'])){
            $hook['PARAMS']['hook'] = [];
        }
        if(!isset($hook['PARAMS']['hook']['users'])){
            $hook['PARAMS']['hook']['users'] = [];
        }
        $isGrid = true;
        if(isset($hook['PARAMS']['handler']['from']) && $hook['PARAMS']['handler']['from'] === 'APP_EXLINK'){
            $isGrid = false;
        }
        if(isset($hook['PARAMS']['handler']['type']) && $hook['PARAMS']['handler']['type'] == 'REST_APP_WRAP'){
            $isGrid = false;
        }
        $hook['isGrid'] = $isGrid;
    }
    unset($hook);

}
$fieldsData = [];
$entityData = [
    'CRM_LEAD'=>['title'=>'Лид'],
    'CRM_CONTACT'=>['title'=>'Контакт'],
    'CRM_COMPANY'=>['title'=>'Компания'],
    'CRM_DEAL'=>['title'=>'Сделка'],
    'CRM_QUOTE'=>['title'=>'Предложение'],
    'CRM_INVOICE'=>['title'=>'Счет'],
];
if($ufResult){
    if(isset($ufResult['uf_crm']['fields']) && !empty($ufResult['uf_crm']['fields'])){
        foreach($ufResult['uf_crm']['fields'] as $field){
            $field['moduleId'] = 'crm';
            $field['settTitle'] = $field['editFormLabel']['ru'];
            if(!$field['settTitle']) $field['settTitle'] = $field['fieldName'];
            $optionName = md5(serialize([$field['id'],$field['moduleId'],$field['fieldName']]));
            $fieldsData[$optionName] = $field;
        }
    }
    if(isset($ufResult['uf_rpa']['fields']) && !empty($ufResult['uf_rpa']['fields'])){
        foreach($ufResult['uf_rpa']['fields'] as $field){
            $field['moduleId'] = 'rpa';
            $field['settTitle'] = $field['editFormLabel']['ru'];
            if(!$field['settTitle']) $field['settTitle'] = $field['fieldName'];
            $optionName = md5(serialize([$field['id'],$field['moduleId'],$field['fieldName']]));
            $fieldsData[$optionName] = $field;
        }
    }
    if(isset($ufResult['rpa_types']['types']) && !empty($ufResult['rpa_types']['types'])){
        foreach($ufResult['rpa_types']['types'] as $field){
            $entityData['RPA_'.$field['id']] = $field;
        }
    }
    if(isset($ufResult['crm_types']['types']) && !empty($ufResult['crm_types']['types'])){
        foreach($ufResult['crm_types']['types'] as $field){
            $entityData['CRM_'.$field['id']] = $field;
        }
    }
}
if(!empty($fieldsData)){
    $rOptions = \Awz\BxApi\OptionsTable::getList([
        'select'=>['PARAMS','NAME'],
        'filter'=>[
            '=PORTAL'=>$request->get('domain'),
            '=APP'=>$request->get('app'),
            '=NAME'=>array_keys($fieldsData)
        ]
    ]);
    while($data = $rOptions->fetch()){
        $fieldsData[$data['NAME']]['settingsApi'] = $data['PARAMS'];
    }
}
/*
{
'id':1,
'entityId':'hook',
'tabs':'hook',
'title':'test',
'caption': 'test caption'
}
 * */
$hookList = [];
foreach($hookResult as $hook){
    //echo '<pre>';print_r();echo '</pre>';
    if($hook['PARAMS']['handler']['from'] == 'DOCS') continue;
    if($hook['PARAMS']['handler']['from'] && (mb_strpos($hook['PARAMS']['handler']['from'], 'EXT_AWZORM_')!==false)) continue;
    $item = [
        'id'=>'HOOK_'.$hook['ID'],
        'entityId'=>'hook',
        'tabs'=>'hook',
        'caption'=>'HOOK_'.$hook['ID']
    ];
    $title = $hook['ID'];
    if(isset($hook['PARAMS']['handler']['name']) && $hook['PARAMS']['handler']['name'])
        $title = $hook['PARAMS']['handler']['name'];
    if(isset($hook['PARAMS']['hook']['desc_admin']) && $hook['PARAMS']['hook']['desc_admin'])
        $item['subtitle'] = $hook['PARAMS']['hook']['desc_admin'];
    $item['title'] = $title;
    $hookList[] = $item;
}
$hookList[] = [
    'id'=>'group',
    'entityId'=>'hook',
    'tabs'=>'hook',
    'caption'=>'group',
    'title'=>'Группы/Проекты',
    'subtitle'=>'Сущность одного типа'
];

$checkAuth = $controller->getScopeCollection()->getByCode('user')->getStatus() === 'ok';
$pageResult = new Result();
if(!$checkAuth){
    $pageResult->addError(new Error('Ошибка авторизации'));
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
        <div class="appWrap" data-page="handler-sett">
            <div class="container"><div class="row"><div class="ui-block-wrapper">
                        <div class="ui-block-title">
                            <div class="ui-block-title-text">Настройки пользовательских полей</div>
                            <div class="ui-block-title-actions">
                                <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
                            </div>
                        </div>
                        <div class="ui-block-content active">

                            <div class="ui-alert ui-alert-warning awz-save-hook-params-empty" style="max-width:100%;margin-top:-20px;">
                            <span class="ui-alert-message">
                            В случае добавления новых полей, необходимо очистить кеш
                                для их настройки.
                                <br><br><a onclick="window.openGridSelector.clearCache();return false;" class="ui-btn ui-btn-danger ui-form-link" href="#">очистить кеш полей</a>
                            </span>

                            </div>

                            <input type="hidden" id="signed_key" value="<?=$request->get('signed')?>">
                            <?
                            $issetTitle = [];
                            foreach($fieldsData as $field){

                                $groupTitle = 'Неизвестная сущность';
                                if(isset($field['entityId']) && $field['entityId'] &&
                                    isset($entityData[$field['entityId']]['title']) && $entityData[$field['entityId']]['title']
                                ){
                                    $groupTitle = $entityData[$field['entityId']]['title'];
                                }
                                $groupKey = md5($groupTitle);
                                if(!in_array($groupKey, $issetTitle)){
                                    $issetTitle[] = $groupKey;
                                    ?>
                                    <div class="container" style="margin:5px 15px;">
                                    <div class="row"><h3>Сущность: <?=$groupTitle?></h3></div>
                                    </div>
                                <?}?>
                                <?
                                $inputId = $field['fieldName'];
                                ?>
                                <div class="container" style="margin-bottom:10px;">
                                    <?//echo'<pre>';print_r($field['settingsApi']['hooks']);echo'</pre>';?>
                                    <form id="form_<?=$inputId?>">
                                    <div class="ui-form ui-form-section">
                                        <div class="ui-form-row ui-form-row-middle-input" style="padding: 20px  0 10px 0;">
                                        <h4><?=$field['settTitle']?> [<?=$field['fieldName']?>]</h4>
                                        </div>
                                        <div class="ui-form-row ui-form-row-middle-input" id="row_<?=$inputId?>">
                                            <div class="ui-form-label">
                                                <div class="ui-ctl-label-text">Грид(ы) для поиска значений</div>
                                            </div>
                                            <div class="ui-ctl ui-ctl-textbox ui-ctl-w100" id="placements-list-right-block">
                                                <input type="text" name="hooks" id="val_<?=$inputId?>" class="ui-ctl-element" value="<?=$field['settingsApi']['hooks']?>" placeholder="Выберите встройки">
                                                <input type="hidden" name="id" value="<?=$field['id']?>">
                                                <input type="hidden" name="name" value="<?=$field['fieldName']?>">
                                                <input type="hidden" name="module" value="<?=$field['moduleId']?>">
                                            </div>
                                            <a style="float:left;" onclick="window.openGridSelector.show('val_<?=$inputId?>');return false;" class="ui-btn ui-form-link" href="#">выбрать ...</a>
                                        </div>
                                        <div class="ui-form-row ui-form-row-middle-input">
                                            <a style="float:left;" onclick="window.openGridSelector.save('form_<?=$inputId?>','<?=$field['moduleId']?>',<?=$field['id']?>);return false;" class="ui-btn ui-form-link" href="#">сохранить настройки</a>
                                            <span class="awz-form-result"></span>
                                        </div>

                                    </div>
                                    </form>

                                </div>
                            <?
                            }
                            ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            window.openGridSelector = {
                clearCache: function(){
                    var data = {};
                    data['signed'] = $('#signed_key').val();
                    data['domain'] = '<?=$request->get('domain')?>';
                    data['app'] = '<?=$request->get('app')?>';
                    $.ajax({
                        url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.clearfieldscache',
                        data: data,
                        dataType: "json",
                        type: "POST",
                        CORS: false,
                        crossDomain: true,
                        timeout: 3000,
                        async: true,
                        success: function (res, textStatus) {
                            if(res.hasOwnProperty('status') && res['status'] == 'success'){
                                BX.SidePanel.Instance.close();
                            }else{
                                alert(res['errors'][0]['message']);
                            }
                        },
                        error:function(){
                            alert('ошибка');
                        }
                    });
                },
                save: function(formId, moduleId, id){
                    $('#'+formId+' .awz-form-result').html('');
                    var data = {};
                    $('#'+formId).find('input').each(function(itm){
                        if($(this).attr('name')){
                            data[$(this).attr('name')] = $(this).val();
                        }
                    });
                    data['signed'] = $('#signed_key').val();
                    data['domain'] = '<?=$request->get('domain')?>';
                    data['app'] = '<?=$request->get('app')?>';
                    $.ajax({
                        url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.setfieldparam',
                        data: data,
                        dataType: "json",
                        type: "POST",
                        CORS: false,
                        crossDomain: true,
                        timeout: 3000,
                        async: true,
                        success: function (res, textStatus) {
                            if(res.hasOwnProperty('status') && res['status'] == 'success'){
                                $('#'+formId+' .awz-form-result').html('сохранено');
                            }else{
                                $('#'+formId+' .awz-form-result').html('<span style="color:red;">ошибка: '+res['errors'][0]['message']+'</span>');
                            }
                            console.log(res)
                        },
                        error:function(){
                            $('#'+formId+' .awz-form-result').html('<span style="color:red;">ошибка</span>');
                        }
                    });
                },
                setMultiselectItems: function(ev, field_id){
                    try{
                        var items = this.openGridSelector_ob.getSelectedItems();
                    }catch (e) {
                        console.log(e);
                    }
                    var values = [];
                    items.forEach(function(itm){
                        values.push(itm.id);
                    });
                    $('#'+field_id).val(values.join(','));
                    //console.log(items, targetNode);
                },
                show: function(id, field_id){
                    if(!field_id) field_id = id;
                    var parent = this;
                    this.openGridSelector_ob = new BX.UI.EntitySelector.Dialog({
                        targetNode: document.getElementById(id),
                        cacheable: false,
                        enableSearch: false,
                        dropdownMode: true,
                        multiple: true,
                        focusOnFirst: false,
                        compactView: true,
                        items: <?=\CUtil::phpToJsObject($hookList)?>,
                        tabs: [{'id': 'hook', 'title': 'Гриды'}],
                        events: {
                            'Item:onSelect':function(e){
                                parent.setMultiselectItems(e.getTarget(), field_id);
                            },
                            'Item:onDeselect':function(e){
                                parent.setMultiselectItems(e.getTarget(), field_id);
                            },
                            onFirstShow: function(e){
                                /*try{
                                    var dialog = e.getTarget();
                                    data[0]['VALUES'].forEach(function(itm){
                                        console.log(itm);
                                        dialog.addItem(itm);
                                    });
                                }catch (e) {
                                    console.log(e);
                                }*/
                            }
                        }
                    });
                    this.openGridSelector_ob.show();
                }
            };
            //window.AwzBx24EntityLoader_ob.load();
        </script>
        <?//echo'<pre>';print_r($hookResult);echo'<pre>';?>

        <?
    }else{
        echo \Awz\BxApi\Helper::errorsHtml($pageResult, 'Ошибка');
    }

    //echo'<pre>';print_r($controller->getErrors());echo'</pre>';
    //echo'<pre>';print_r($hookResult);echo'</pre>';
    //echo'<pre>';print_r($ufResult);echo'</pre>';
    //echo'<pre>';print_r($request->getValues());echo'</pre>';
    //echo'<pre>';print_r($fieldsData);echo'</pre>';
    ?>
    <?if(!$request->get('html')){?>
</div>
</body></html>
<?}?>
<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");