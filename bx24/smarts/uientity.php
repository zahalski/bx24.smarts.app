<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
header("Access-Control-Allow-Origin: *");

use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension as UIExt;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Web\Json;
use Awz\BxApi\App;
use Awz\BxApi\Helper;
use Awz\BxApi\TokensTable;
use Awz\BxApi\OptionsTable;

if(!Loader::includeModule('awz.bxapi')){
    return;
}
if(!Loader::includeModule('awz.admin')){
    return;
}

global $APPLICATION;
$appId = 'app.63d6b637131902.97765356';
$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
if($request->get('app')){
    $appId = $request->get('app');
}

$app = new App(array(
    'APP_ID'=>$appId,
    'APP_SECRET_CODE'=>Helper::getSecret($appId)
));

$tkn = array();
$tkn['access_token'] = htmlspecialchars($app->getRequest()->get('AUTH_ID'));
$tkn['client_endpoint'] = 'https://' .htmlspecialchars($app->getRequest()->get('DOMAIN')). '/rest/';
$app->setAuth($tkn);
$app->prepareBatchCached([
    'app.option.get'=>'app.option.get',
    'profile'=>'profile',
]);
$resOptions = $app->getBatchCached('app.option.get');
$resUser = $app->getBatchCached('profile');
$keyExternal = '';

$loadParamsEntity = new \Bitrix\Main\Result();

if($resOptions->isSuccess()){
    $optionsData = $resOptions->getData();
    $profileData = $resUser->getData();
    if($optionsData['result']['result']['auth']){
        $checkAuth = TokensTable::checkServiceKey($app->getConfig('APP_ID'), $app->getRequest()->get('DOMAIN'), $optionsData['result']['result']['auth']);
        if($checkAuth){
            $checkAuthKey = $optionsData['result']['result']['auth'];
            $checkAuthDomain = $app->getRequest()->get('DOMAIN');
            $checkAuthMember = $profileData['result']['result']['ID'];
            $checkAuthAppId = $app->getConfig('APP_ID');
        }
    }
}else{
    $loadParamsEntity->addErrors($resOptions->getErrors());
}
if(!$checkAuthKey){
    $loadParamsEntity->addError(new \Bitrix\Main\Error('авторизация не найдена'));
}
$placement = $app->getRequest()->get('PLACEMENT_OPTIONS');
if($placement) {
    $placement = Json::decode($placement);
}
$arParams = [];
include_once(__DIR__.'/include/awz_placements.php');
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <?
    CJSCore::init('jquery');
    Asset::getInstance()->addCss("/bitrix/css/main/bootstrap.css");
    Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
    Asset::getInstance()->addCss("/bx24/smarts/style.css");
    Asset::getInstance()->addJs("/bx24/smarts/scriptn.js");
    UIExt::load("ui.buttons");
    UIExt::load("ui.buttons.icons");
    UIExt::load("ui.alerts");
    UIExt::load("ui.forms");
    UIExt::load("ui.icons");
    UIExt::load("ui.layout-form");
    UIExt::load('ui.entity-selector');
    ?>
    <?$APPLICATION->ShowHead()?>
    <script src="//api.bitrix24.com/api/v1/"></script>
</head>
<body>
<div class="ui-block-content active" id="ui-entity-userfield-awz" style="margin-bottom:0;padding-bottom:0;">
    <?if($loadParamsEntity->isSuccess()){?>
        <?if($placement['MODE']=='edit'){?>
        <?
        $fieldCode = $placement['FIELD_NAME'];
        $key = md5(serialize(['crm',$fieldCode]));
        $crmEntityCodes = [];
        $res = OptionsTable::getList([
            'select'=>['PARAMS'],
            'filter'=>[
                '=APP'=>$app->getConfig('APP_ID'),
                '=PORTAL'=>$checkAuthDomain,
                '=NAME'=>$key
            ],
            'limit'=>1
        ])->fetch();
        if($res && isset($res['PARAMS']['hooks']) && !empty($res['PARAMS']['hooks'])){
            $crmEntityCodes = explode(',', $res['PARAMS']['hooks']);
        }
        $editId = 'field_'.$placement['FIELD_NAME'];
        $fieldHtml = '<div class="wrp ui-ctl ui-ctl-textbox ui-ctl-w100"><input value="'.(is_array($placement['VALUE']) ? implode(',',$placement['VALUE']) : $placement['VALUE']).'" name="'.$fieldCode.'" class="ui-ctl-element" id="'.$fieldCode.'_control"/></div><button id="'.$editId.'" class="ui-btn ui-form-link" onclick="window.awz_helper.openDialogAwzCrm(\'row_'.$editId.'\',\''.implode(',',$crmEntityCodes).'\', \''.($placement['MULTIPLE']=='Y' ? 'Y' : 'N').'\');return false;">...</button>';
        ?>
        <div class="ui-form ui-form-section" style="padding:2px 5px 5px 2px;">
        <div class="ui-form-row ui-form-row-middle-input" id="row_<?=$editId?>" style="padding:0;">




            <?=$fieldHtml?>
        </div>
        </div>
            <script>
                BX24.ready(function()
                {
                    BX24.init(function()
                    {
                        BX24.resizeWindow(document.body.clientWidth,
                            document.getElementsByClassName("ui-block-content")[0].clientHeight);
                        //HOOK123_524
                        //BX24.placement.call('setValue', 'HOOK_124_226');
                    });
                });

            </script>
        <?}elseif($placement['MODE']=='view'){
            $fieldCode = $placement['FIELD_NAME'];
            $key = md5(serialize(['crm',$fieldCode]));
            $crmEntityCodes = [];
            $res = OptionsTable::getList([
                'select'=>['PARAMS'],
                'filter'=>[
                    '=APP'=>$app->getConfig('APP_ID'),
                    '=PORTAL'=>$checkAuthDomain,
                    '=NAME'=>$key
                ],
                'limit'=>1
            ])->fetch();
            if($res && isset($res['PARAMS']['hooks']) && !empty($res['PARAMS']['hooks'])){
                $crmEntityCodes = explode(',', $res['PARAMS']['hooks']);
            }

            $values = [];
            if($placement['MULTIPLE']=='N'){
                $placement['VALUE'] = [$placement['VALUE']];
            }
            if(!empty($placement['VALUE'])){
                foreach($placement['VALUE'] as $vId){
                    $vId = trim($vId);
                    if(!$vId) continue;
                    $itmAr = explode('_', $vId);
                    if($crmEntityCodes[0]=='group' && count($crmEntityCodes)==1){
                        $type_temp = 'group';
                        $values[] = '<div data-type="'.$type_temp.'" data-id="'.$vId.'" data-ido="'.$vId.'" class="awz-autoload-field awz-autoload-'.$type_temp.'-'.$vId.'">'.$vId.'</div>';
                    }
                    if(count($itmAr)!=2) continue;
                    $type_temp = 'awzuientity';
                    $intId = $itmAr[1];
                    $type_temp_ = \Awz\Admin\Helper::getCrmTypeFromShort($itmAr[0]);
                    if($type_temp_) $type_temp = $type_temp_;
                    $values[] = '<div data-type="'.$type_temp.'" data-id="'.$intId.'" data-ido="'.$vId.'" class="awz-autoload-field awz-autoload-'.$type_temp.'-'.$intId.'">'.$intId.'</div>';
                }
            }
            ?>

        <div class="ui-form ui-form-section" style="padding:2px 5px 5px 2px;overflow:hidden;display:block;">
            <?if(!empty($values)){?>
                <?=implode("", $values);?>
            <?}else{?>
                <style>body, html {overflow:hidden;}</style>
                <span class="awz-user-field-val">значение не указано</span>
            <?}?>
        </div>

        <?}?>
        <script>
            window.awz_plc_setValues = function(){
                <?if($placement['MULTIPLE']=='N'){?>
                BX24.placement.call('setValue', $('#ui-entity-userfield-awz input').val());
                <?}else{?>
                var vl = [];
                //console.log($('#ui-entity-userfield-awz input').val());
                if($('#ui-entity-userfield-awz input').val()){
                    vl = $('#ui-entity-userfield-awz input').val().split(',');
                }
                if(!vl.length){
                    vl.push('');
                }
                BX24.placement.call('setValue', vl);
                <?}?>
            };
            window.AwzBx24EntityLoader_ents = {};
            <?foreach($arParams['JS_ENTITIES'] as $code=>$ent){
            ?>
            try{window.AwzBx24EntityLoader_ents['<?=$code?>'] = <?=$ent?>;}catch(e){}
            <?
            }?>
            BX24.ready(function()
            {
                BX24.init(function()
                {
                    BX24.resizeWindow(document.body.clientWidth,
                        document.getElementsByClassName("ui-block-content")[0].clientHeight);
                    window.awz_helper.autoLoadEntity = new AwzBx24EntityLoader();
                    window.awz_helper.autoLoadEntity.init();
                    window.awz_helper.autoLoadEntity.loadDynamicCrm();
                    window.awz_helper.autoLoadEntity.load();
                    //HOOK123_524
                    //BX24.placement.call('setValue', 'HOOK123_524');
                });
            });
        </script>
        <?//echo'<pre>';print_r([$checkAuthKey, $checkAuthDomain, $checkAuthMember, $checkAuthAppId, $app->getRequest()->toArray()]);echo'<pre>';?>

    <?}else{
        $customPrint = false;
        $arParams = [];
        include(__DIR__.'/include/standart_actions.php');
        ?>
    <?}?>

</div>
<script>
    BX24.ready(function()
    {
        BX24.init(function()
        {
            BX24.resizeWindow(document.body.clientWidth,
                document.getElementsByClassName("ui-block-content")[0].clientHeight);
        });
    });
</script>
<style>html, body {background-color: #f8f9fa;}
.ui-selector-popup-container {left:auto!important;right:1px!important;top:44px!important;}
.awz-ext-window h4 {display:none;}
.awz-ext-window {padding:3px;}
</style>
</body>
</html>
<?
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_after.php");