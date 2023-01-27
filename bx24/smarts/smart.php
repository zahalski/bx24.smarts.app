<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/interface/admin_list.php');
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/interface/admin_lib.php');
//header("Access-Control-Allow-Origin: *");

use Awz\Admin\IList;
use Awz\Admin\IParams;
use Awz\BxApi\TokensTable;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Awz\bxApi\App;
use Awz\bxApi\Helper;
use Bitrix\Main\Web\Json;
//use Bitrix\Main\UI\Extension;

if(!Loader::includeModule('awz.bxapi')){
    return;
}
if(!Loader::includeModule('awz.admin')){
    return;
}

$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('SmartList', 'OnEndBufferContent'), false, 999);

class SmartList extends IList implements IParams {

    public static $smartId;

    public static function OnEndBufferContent(&$content){
        $content = str_replace('parent.BX.ajax.','window.awz_ajax_proxy.', $content);
    }

    public function __construct($params, $publicMode=false){

        if(!empty($params['SMART_FIELDS'])){
            \Awz\Admin\SmartTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = 'awz_smart_'.$params['SMART_ID'];

        parent::__construct($params, $publicMode);
    }

    public function trigerGetRowListAdmin($row){
        if(!$row->arRes['id']){
            foreach($row->arRes as $k=>$v){
                $row->arRes[$k] = '';
                $row->AddInputField($k);
            }
            //return;
        }

        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;

        foreach($fields as $fieldCode=>$fieldData){
            if($fieldData['type'] == 'datetime'){
                if(strtotime($row->arRes[$fieldCode])){
                    $row->arRes[$fieldCode] = \Bitrix\Main\Type\DateTime::createFromTimestamp(strtotime($row->arRes[$fieldCode]));
                }else{
                    $row->arRes[$fieldCode] = '';
                }
            }
            if($fieldData['type'] == 'date'){
                if(strtotime($row->arRes[$fieldCode])){
                    $row->arRes[$fieldCode] = \Bitrix\Main\Type\Date::createFromTimestamp(strtotime($row->arRes[$fieldCode]));
                }else{
                    $row->arRes[$fieldCode] = '';
                }
            }
            if($fieldCode == 'title'){
                $row->AddViewField($fieldCode, '<a class="open-smart" data-ent="'.$this->getParam('SMART_ID').'" data-id="'.$row->arRes['id'].'" href="#">'.$row->arRes[$fieldCode].'</a>');
                //$row->AddViewField($fieldCode, '<a class="open-app" href="https://zahalski.bitrix24.by/marketplace/view/56/?params[smart]=186">'.$row->arRes[$fieldCode].'</a>');
                $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
            }elseif($fieldCode == 'id'){
                $row->AddViewField($fieldCode, '<a class="open-smart" data-ent="'.$this->getParam('SMART_ID').'" data-id="'.$row->arRes['id'].'" href="#">'.$row->arRes[$fieldCode].'</a>');
            }elseif($fieldData['isReadOnly']){
                $row->AddViewField($fieldCode, $row->arRes[$fieldCode]);
            }else{
                if($fieldData['type'] == 'string'){
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                }
                if($fieldData['type'] == 'money'){
                    /*$row->aFields[$fieldCode]["edit"] = array(

                    );*/
                    //$row->aFields['id']['edit']['type'] == 'money';
                    /*$row->AddMoneyField($fieldCode, array(
                            'PRICE'=>$row->arRes[$fieldCode],
                            'CURRENCY'=>'BYN',
                    ));*/
                }
                if($fieldData['type'] == 'double'){
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                }
                if($fieldData['type'] == 'integer'){
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                }
                if($fieldData['type'] == 'url'){
                    $row->AddViewField($fieldCode, '<a target="_blank" href="'.$row->arRes[$fieldCode].'">'.$row->arRes[$fieldCode].'</a>');
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                }
                if($fieldData['type'] == 'date'){
                    $row->AddCalendarField($fieldCode, array());
                }
                if($fieldData['type'] == 'datetime'){
                    $row->AddCalendarField($fieldCode, array(), true);
                }
                if($fieldData['type'] == 'boolean'){
                    $row->AddCheckField($fieldCode, array());
                }
            }
        }

        /*$row->AddField(
            "title",
            $row->arRes['title'],
            true
        );
        $row->AddInputField("title", array("size"=>20));
        $row->AddInputField("CODE", array("size"=>20));
        $row->AddField(
            "ufCrm14Link",
            '<a href="'.$row->arRes['ufCrm14Link'].'">'.$row->arRes['ufCrm14Link'].'</a>',
            true
        );
        $row->AddInputField("ufCrm14Link", array("size"=>20));
        $row->AddInputField("TEST", array("size"=>20));*/
        //$row->AddViewField("title", $row->arRes['title']);
        //$row->AddEditField("title",'<input type="text" name="title" value="'.$row->arRes['title'].'"/>');
    }

    public function trigerInitFilter(){
    }


    public function trigerGetRowListActions(array $actions): array
    {
        return $actions;
    }

    public static function getTitle(): string
    {
        return Loc::getMessage('AWZ_BXAPI_CURRENCY_CODES_LIST_TITLE');
    }

    public static function getParams(): array
    {
        $arParams = array(
            "PRIMARY"=>"id",
            "ENTITY" => "\\Awz\\Admin\\SmartTable",
            "BUTTON_CONTEXTS"=>array(),
            "ADD_GROUP_ACTIONS"=>array("edit","delete"),
            "ADD_LIST_ACTIONS"=>array("delete"),
            "FIND"=>array()
        );

        return $arParams;
    }

    public function initFilter(){
        if(!$this->getParam("FIND")) return;

        $this->filter = array();

        $this->getAdminList()->AddFilter($this->getParam("FIND"), $this->filter);

        $this->checkFilter();

        if(method_exists($this, 'trigerInitFilter'))
            $this->trigerInitFilter();
    }

    public function getAdminResult(){
        static $results;
        if(!$results){
            $request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
            if($bx_result = $request->getPost('bx_result')){
                $results = $bx_result;
            }
        }
        return $results;
    }


    public function getAdminRow(){
        $n = 0;
        $pageSize = $this->getAdminList()->getNavSize();
        $res = $this->getAdminResult();
        $ost = 0;
        if(isset($res['next'])){
            $ost = fmod($res['next'],50);
            if($ost == 50) $ost = 0;
        }
        //echo'<pre>';print_r($ost);echo'</pre>';
        //die();
        if(isset($res['items'])){
            foreach ($res['items'] as $row){
                //$row['id'] = 'n: '.$n.', ost: '.$ost.', pageSize: '.$pageSize;
                //echo'<pre>';print_r($row);echo'</pre>';
                $n++;
                if($ost && ($ost>$n)) continue;
                if ((($n-$ost) > $pageSize) && !$this->excelMode)
                {
                    break;
                }
                $this->getRowListAdmin($row);
            }
        }else{
            $this->getRowListAdmin(array());
        }
        $nav = $this->getAdminList()->getPageNavigation($this->getParam('TABLEID'));
        $nav->setRecordCount($nav->getOffset() + $n);
        $this->getAdminList()->setNavigation($nav, Loc::getMessage($this->getParam("LANG_CODE")."NAV_TEXT"), false);

    }

    public function defaultPublicInterface(){

        global $APPLICATION;
        //инициализация фильтра
        $this->initFilter();
        //проверка действий
        //$this->checkActions($this->getParam('RIGHT', 'D'));
        //доступные колонки, устанавливает только нужные поля в выборку
        $this->AddHeaders();

        //формирование списка
        $this->getAdminRow();

        $this->AddGroupActionTable();
        //$list_id = $this->getParam('TABLEID');

        if($this->getParam('FIND')){
            $this->getAdminList()->DisplayFilter($this->getParam('FIND', array()));
        }

        $defPrm = ["SHOW_COUNT_HTML" => false];
        if($this->getParam('ADD_REQUEST_KEY')){
            $defPrm['ADD_REQUEST_KEY'] = $this->getParam('ADD_REQUEST_KEY');
        }
        $this->getAdminList()->DisplayList($defPrm);

        if($this->getParam('SMART_ID')){
            ?>
            <script type="text/javascript">
                $(document).ready(function(){
                    BX24.ready(function() {
                        BX24.init(function () {
                            window.awz_helper.init('<?=$this->getParam('ADD_REQUEST_KEY')?>',<?=$this->getParam('SMART_ID')?>,'<?=$this->getParam('TABLEID')?>', <?=$this->getAdminList()->getNavSize()?>);
                        });
                    });
                });
            </script>
            <?php
        }

    }
}

use SmartList as PageList;

$arParams = PageList::getParams();

include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/awz.admin/include/handler.php");
/* @var bool $customPrint */

global $APPLICATION;
$appId = 'local.63c7b109704d98.56772413';
if($_REQUEST['app']){
    $appId = $_REQUEST['app'];
}
$app = new App(array(
    'APP_ID'=>$appId,
    'APP_SECRET_CODE'=>Helper::getSecret($appId),
    //'LOG_FILENAME'=>'bx_log_save_txt_n_test.txt',
    //'LOG_DIR'=>__DIR__
));

$checkAuth = false;
$checkAuthKey = false;
$checkAuthDomain = false;
$checkAuthMember = false;
$checkAuthAppId = false;

$s_id = $app->getRequest()->get('key');
if($s_id){
    $tmp = explode("|", $s_id);
    if(count($tmp)!=5) {
        $s_id = '';
    }elseif(!$tmp[0] || !$tmp[1] || !$tmp[2]|| !$tmp[3]){
        $s_id = '';
    }else{
        $hash = hash_hmac('sha256', implode("|",array($tmp[0], $tmp[1], $tmp[2], $tmp[3])), $app->getConfig('APP_SECRET_CODE'));
        if($hash != $tmp[4]) $s_id = '';
    }
}

if($s_id){

    $s_id = $tmp[0];
    $checkAuth = TokensTable::checkServiceKey($app->getConfig('APP_ID'), $app->getRequest()->get('DOMAIN'), $s_id);
    if($checkAuth){
        $checkAuthKey = $s_id;
        $checkAuthDomain = $app->getRequest()->get('DOMAIN');
        $checkAuthMember = $tmp[2];
        $checkAuthAppId = $tmp[3];
    }

}elseif($app->getRequest()->get('AUTH_ID')){
    $tkn = array();
    $tkn['access_token'] = htmlspecialchars($app->getRequest()->get('AUTH_ID'));
    $tkn['client_endpoint'] = 'https://' .htmlspecialchars($app->getRequest()->get('DOMAIN')). '/rest/';
    $app->setAuth($tkn);
    $resOptions = $app->getMethod('app.option.get', array('option'=>array()));
    $resUser = $app->getMethod('profile');
    $keyExternal = '';

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
    }
}

//$app->log($_REQUEST, 'request');

$placement = $app->getRequest()->get('PLACEMENT_OPTIONS');
if($placement) {
    $placement = Json::decode($placement);
}

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <?
    if($checkAuth){
        CJsCore::init('jquery');
        CJSCore::Init(array('popup', 'date'));
        Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
        Asset::getInstance()->addJs("/bx24/smarts/script.js");
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
<?php
if(!$checkAuth){
    ?>
    <div class="container"><div class="row"><div class="ui-block-wrapper">
    <?
    echo Helper::errorsHtmlFromText(
        array(
            'Проверка авторизации провалена'),
        'Ошибка получения опций приложения');?>
    </div></div></div>
    <?
}else{
    $arParams['SMART_ID'] = $placement['smart'];
    if(!$arParams['SMART_ID']) $arParams['SMART_ID'] = preg_replace('/([^0-9])/','',$_REQUEST['smartId']);
    if(!$arParams['SMART_ID']) $arParams['SMART_ID'] = preg_replace('/([^0-9])/','',$_REQUEST['grid_id']);
    if($arParams['SMART_ID']){

        $arParams['ADD_REQUEST_KEY'] = $checkAuthKey.'|'.$checkAuthDomain.'|'.$checkAuthMember.'|'.$app->getConfig('APP_ID');
        $hash = hash_hmac('sha256', $arParams['ADD_REQUEST_KEY'], $app->getConfig('APP_SECRET_CODE'));
        $arParams['ADD_REQUEST_KEY'] .= '|'.$hash;
        $app->getRequest()->set('key', $arParams['ADD_REQUEST_KEY']);

        $cacheId = $app->getRequest()->get('DOMAIN').'fields_bagsmart_'.$arParams['SMART_ID'];

        $auth = TokensTable::getList(array(
            'select'=>array('*'),
            'filter'=>array('=PORTAL'=>$app->getRequest()->get('DOMAIN'), '=APP_ID'=>$app->getConfig('APP_ID'))
        ))->fetch();
        $resultAuth = $app->setAuth($auth['TOKEN']);

        $app->setCacheParams($cacheId);
        $bxRowsResFields = $app->postMethod('crm.item.fields.json', array(
            'entityTypeId'=>$arParams['SMART_ID'],
        ));
        if($bxRowsResFields->isSuccess()) {
            $bxFields = $bxRowsResFields->getData();
            $allFields = $bxFields['result']['result']['fields'];
            $arParams['SMART_FIELDS'] = $allFields;
            $app->log($allFields, 'allFields');
            /*for($i=0; $i<50; $i++){
                $app->postMethod('crm.item.add', array(
                    'entityTypeId'=>$arParams['SMART_ID'],
                    'fields'=>[
                            'title'=> 'test 555 '.rand(100,999).', '.rand(100,999)
                    ]
                ));
            }*/
        }else{
            $app->cleanCache($cacheId);
        }
    }
    if($arParams['SMART_ID'] && !$customPrint){
        PageList::$smartId = $arParams['SMART_ID'];
        $adminCustom = new PageList($arParams, true);

        $fields = \Awz\Admin\SmartTable::getMap();
        foreach($fields as $obField){
            if($obField instanceof \Bitrix\Main\ORM\Fields\StringField){
                $arParams['FIND'][] = array(
                    'id'=>'%'.$obField->getColumnName(),
                    'name'=>'[%] '.$obField->getTitle(),
                );
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>'[=] '.$obField->getTitle(),
                );
            }
            if($obField instanceof \Bitrix\Main\ORM\Fields\TextField){
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>'[%] '.$obField->getTitle()
                );
            }
        }
        $adminCustom->setParam('FIND',$adminCustom->formatFilterFields($arParams['FIND']));
        $adminCustom->defaultInterface();
    }
}
?>
</body>
</html>
<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");