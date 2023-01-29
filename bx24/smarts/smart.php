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
use Bitrix\Main\UI\Filter\Options as FilterOptions;
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

    public function getUser(int $id = 0)
    {

        static $users = array();

        if(!isset($users[$id])){
            $request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
            if($bx_result = $request->getPost('bx_result')){
                if(isset($bx_result['users'][$id])){
                    $users[$id] = $bx_result['users'][$id];
                }
            }
        }
        return $users[$id] ?? array();
    }

    public function trigerGetRowListAdmin($row){
        $request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
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
                if(!$fieldData['isReadOnly']){
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                }
            }elseif($fieldCode == 'id'){
                $row->AddViewField($fieldCode, '<a class="open-smart" data-ent="'.$this->getParam('SMART_ID').'" data-id="'.$row->arRes['id'].'" href="#">'.$row->arRes[$fieldCode].'</a>');
            }else{
                if($fieldData['type'] == 'string'){
                    if(!$fieldData['isReadOnly']) {
                        $row->AddInputField($fieldCode, array("size" => $fieldData['settings']['SIZE']));
                    }
                }
                if($fieldData['type'] == 'money'){
                    $val = explode('|', $row->arRes[$fieldCode]);
                    /*$row->aFields[$fieldCode]["edit"] = array(

                    );*/
                    //$row->aFields['id']['edit']['type'] == 'money';
                    /*$row->AddMoneyField($fieldCode, array(
                        'PRICE'=>$val[0],
                        'CURRENCY'=>$val[1],
                        'CURRENCY_LIST'=>[[$val[1] => $val[1]]],
                        'HIDDEN'=>[['NAME'=>'test', 'VALUE'=>'test'],['NAME'=>'test2', 'VALUE'=>'test2']],
                        'ATTRIBUTES'=>[
                                'PLACEHOLDER'=>''
                            //'CURRENCY_LIST'=>[$val[1] => $val[1]]
                        ]
                    ));*/
                    $row->AddInputField($fieldCode);
                }
                if($fieldData['type'] == 'double'){
                    if(!$fieldData['isReadOnly']) {
                        $row->AddInputField($fieldCode, array("size" => $fieldData['settings']['SIZE']));
                    }
                }
                if($fieldData['type'] == 'user'){
                    $row->AddInputField($fieldCode, array("size"=>$fieldData['settings']['SIZE']));
                    $user = $this->getUser(intval($row->arRes[$fieldCode]));
                    $userName = '';
                    if(!empty($user)){
                        $userName = '['.intval($row->arRes[$fieldCode]).'] '.htmlspecialcharsbx($user['NAME']).' '.htmlspecialcharsbx($user['LAST_NAME']);
                    }else{
                        $userName = $row->arRes[$fieldCode];
                    }
                    $row->AddViewField($fieldCode, '<a target="_blank" href="https://'.$request->get('DOMAIN').'/company/personal/user/'.intval($row->arRes[$fieldCode]).'/">'.$userName.'</a>');
                }
                if($fieldData['type'] == 'integer'){
                    if(!$fieldData['isReadOnly']) {
                        $row->AddInputField($fieldCode, array("size" => $fieldData['settings']['SIZE']));
                    }
                }
                if($fieldData['type'] == 'url'){
                    $row->AddViewField($fieldCode, '<a target="_blank" href="'.$row->arRes[$fieldCode].'">'.$row->arRes[$fieldCode].'</a>');
                    if(!$fieldData['isReadOnly']) {
                        $row->AddInputField($fieldCode, array("size" => $fieldData['settings']['SIZE']));
                    }
                }
                if($fieldData['type'] == 'date'){
                    $row->AddCalendarField($fieldCode, array());
                }
                if($fieldData['type'] == 'datetime'){
                    $row->AddCalendarField($fieldCode, array(), true);
                }
                if($fieldData['type'] == 'boolean'){
                    if(!isset($fieldData['settings'])){
                        $row->AddCheckField($fieldCode);
                    }else{
                        $label = $row->arRes[$fieldCode];
                        if($label == 0) $label = ($fieldData['settings']['LABEL'][0]) ?? 'нет';
                        if($label == 1) $label = ($fieldData['settings']['LABEL'][1]) ?? 'да';
                        $row->AddViewField($fieldCode,$label);
                        if(!$fieldData['isReadOnly']) {
                            $row->AddEditField($fieldCode, '<label>' . $fieldData['settings']['LABEL_CHECKBOX'] . '</label><input type="checkbox" id="' . htmlspecialcharsbx($fieldCode) . '_control" name="' . htmlspecialcharsbx($fieldCode) . '" value="Y" ' . ($row->arRes[$fieldCode] == '1' || $row->arRes[$fieldCode] === true ? ' checked' : '') . '>');
                        }
                    }

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
        $arParams = [
            "PRIMARY"=>"id",
            "ENTITY" => "\\Awz\\Admin\\SmartTable",
            "BUTTON_CONTEXTS"=>[
                [
                    'add'=> [
                        'TEXT' => 'Добавить',
                        'ICON' => '',
                        'LINK' => '',
                        'ONCLICK' => 'window.awz_helper.menuNewEl();return false;',
                    ]
                ],
                [
                    'reload'=> [
                        'TEXT' => 'Обновить',
                        'ICON' => '',
                        'LINK' => '',
                        'ONCLICK' => 'window.awz_helper.reloadList();return false;',
                    ],
                    'rmcache'=> [
                        'TEXT' => 'Удалить кеш полей',
                        'ICON' => '',
                        'LINK' => '',
                        'ONCLICK' => 'window.awz_helper.rmCache();return false;',
                    ]
                ]
            ],
            "ADD_GROUP_ACTIONS"=> [
                "edit",
                "delete",
                /*"summ"=>[
                     'key'=>"summ","title"=>"Посчитать сумму"
                ]*/
            ],
            "ADD_LIST_ACTIONS"=> [
                "delete",
                "edit"=> [
                    "ICON"=>"edit",
                    "DEFAULT"=>true,
                    "TEXT"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "TITLE"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "ACTION"=>'window.awz_helper.menuNewEl("edit", "#PRIMARY#");'
                ]
            ],
            "FIND"=> []
        ];

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
                if(empty($row)) continue;
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
            if(!$n){
                $this->getRowListAdmin(array());
            }
        }else{
            $this->getRowListAdmin(array());
        }
        $nav = $this->getAdminList()->getPageNavigation($this->getParam('TABLEID'));
        $nav->setRecordCount($nav->getOffset() + $n);
        $this->getAdminList()->setNavigation($nav, Loc::getMessage($this->getParam("LANG_CODE")."NAV_TEXT"), false);

    }

    public static function getDates(){

        $arDates = array();
        $result = array();
        $fields = array(
            'CURRENT_DAY',
            'YESTERDAY',
            'TOMORROW',
            'CURRENT_WEEK',
            'CURRENT_MONTH',
            'CURRENT_QUARTER',
            'LAST_7_DAYS',
            'LAST_30_DAYS',
            'LAST_60_DAYS',
            'LAST_90_DAYS',
            'LAST_WEEK',
            'LAST_MONTH',
            'NEXT_WEEK',
            'NEXT_MONTH',

            'PREV_DAYS',
            'NEXT_DAYS',
        );
        foreach($fields as $field){
            //_days
            $opt = array($field.'_datesel'=>$field);
            if(in_array($field,['PREV_DAYS', 'NEXT_DAYS'])){
                $opt[$field.'_days'] = 0;
            }
            FilterOptions::calcDates($field, $opt, $result);
            $result[$field.'_to'] = date("c",strtotime($result[$field.'_to']));
            $result[$field.'_from'] = date("c",strtotime($result[$field.'_from']));
            $arDates[$field] = array(
                '>='=>$result[$field.'_from'],
                '<='=>$result[$field.'_to']
            );
        }
        //echo '<pre>';print_r($result);echo'</pre>';
        //die();
        return $arDates;

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

        $this->AddAdminContextMenu(false, false);

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
                            window.awz_helper.fields = <?=\CUtil::PhpToJSObject($this->getParam('SMART_FIELDS'))?>;
                            window.awz_helper.filter_dates = <?=\CUtil::PhpToJSObject(SmartList::getDates())?>;
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

        $checkResult = $app->getRequest()->get('bx_result');
        if($checkResult['cache_action'] == 'remove'){
            $app->cleanCache($cacheId);
        }

        $app->setCacheParams($cacheId);
        $bxRowsResFields = $app->postMethod('crm.item.fields.json', array(
            'entityTypeId'=>$arParams['SMART_ID'],
        ));
        if($bxRowsResFields->isSuccess()) {
            $bxFields = $bxRowsResFields->getData();
            $allFields = $bxFields['result']['result']['fields'];
            $arParams['SMART_FIELDS'] = $allFields;
            //echo'<pre>';print_r($allFields);echo'</pre>';
            //die();
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
            /*
             * $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>$obField->getTitle(),
                    'type'=>'custom',
                    "SUB_TYPE" => ['name'=>'test', 'value'=>'test'],
                    "SUB_TYPES" => [
                        ['name'=>'test', 'value'=>'test'],
                        ['name'=>'test2', 'value'=>'test2']
                    ],
                    "VALUES"=>["_from" => "", "_to" => ""],
                    "SELECT_PARAMS" => ["isMulti" => false]
                );
             * */
            $filterTitle = $arParams['SMART_FIELDS'][$obField->getColumnName()]['filterLabel'];
            if(!$filterTitle) $filterTitle = $obField->getTitle();
            if($obField instanceof \Bitrix\Main\ORM\Fields\StringField){
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>$filterTitle,
                    'type'=>'string',
                    'additionalFilter' => [
                        'isEmpty',
                        'hasAnyValue',
                    ],
                );
            }
            if($obField instanceof \Bitrix\Main\ORM\Fields\BooleanField){
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>$filterTitle,
                    'type'=>'checkbox',
                    'valueType'=>'numeric'
                );
            }
            if($obField instanceof \Bitrix\Main\ORM\Fields\IntegerField){
                if($arParams['SMART_FIELDS'][$obField->getColumnName()]['type']=='user'){

                }else{
                    $selectParams = array("isMulti" => false);
                    $values = array(
                        "_from" => "",
                        "_to" => ""
                    );
                    $subtypes = [];
                    $sourceSubtypes = \Bitrix\Main\UI\Filter\NumberType::getList();
                    $additionalSubtypes = \Bitrix\Main\UI\Filter\AdditionalNumberType::getList();
                    foreach($sourceSubtypes as $subtype){
                        $subtypes[] = ['name'=>$subtype, 'value'=>$subtype];
                    }
                    $subtypeType = ['name'=>'exact', 'value'=>'exact'];
                    $arParams['FIND'][] = array(
                        'id'=>$obField->getColumnName(),
                        'name'=>$filterTitle,
                        'type'=>'number',
                        "SUB_TYPE" => $subtypeType,
                        "SUB_TYPES" => $subtypes,
                        "VALUES" => $values,
                        "SELECT_PARAMS" => $selectParams,
                        'additionalFilter' => [
                            'isEmpty',
                            'hasAnyValue',
                        ],
                    );
                }
            }
            if($obField instanceof \Bitrix\Main\ORM\Fields\FloatField){
                $selectParams = array("isMulti" => false);
                $values = array(
                    "_from" => "",
                    "_to" => ""
                );
                $subtypes = [];
                $sourceSubtypes = \Bitrix\Main\UI\Filter\NumberType::getList();
                $additionalSubtypes = \Bitrix\Main\UI\Filter\AdditionalNumberType::getList();
                foreach($sourceSubtypes as $subtype){
                    $subtypes[] = ['name'=>$subtype, 'value'=>$subtype];
                }
                $subtypeType = ['name'=>'exact', 'value'=>'exact'];
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>$filterTitle,
                    'type'=>'number',
                    "SUB_TYPE" => $subtypeType,
                    "SUB_TYPES" => $subtypes,
                    "VALUES" => $values,
                    "SELECT_PARAMS" => $selectParams,
                    'additionalFilter' => [
                        'isEmpty',
                        'hasAnyValue',
                    ],
                );
            }
            if($obField instanceof \Bitrix\Main\ORM\Fields\DateField){
                $arParams['FIND'][] = array(
                    'id'=>$obField->getColumnName(),
                    'name'=>$filterTitle,
                    'time'=>($obField instanceof \Bitrix\Main\ORM\Fields\DateTimeField),
                    'additionalFilter' => [
                        'isEmpty',
                        'hasAnyValue',
                    ],
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