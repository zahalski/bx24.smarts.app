<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php");

//header("Access-Control-Allow-Origin: *");
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/interface/admin_list.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/interface/admin_lib.php');

use Awz\Admin\Grid\Option as GridOptions;
use Awz\Admin\IList;
use Awz\Admin\IParams;
use Awz\BxApi\Api\Filters\Request\SetFilter;
use Awz\BxApi\TokensTable;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Awz\BxApi\App;
use Awz\BxApi\Helper;
use Bitrix\Main\Web\Json;
use Bitrix\Main\UI\Filter\Options as FilterOptions;
use Bitrix\Main\Application;
use Awz\BxApi\Api\Filters\Request\ParseHook;
//use Bitrix\Main\UI\Extension;

if(!Loader::includeModule('awz.bxapi')){
    return;
}
if(!Loader::includeModule('awz.admin')){
    return;
}

$request = Application::getInstance()->getContext()->getRequest();
$request->addFilter(new ParseHook());

//echo'<pre>';print_r($request->getValues());echo'</pre>';

$tracker = null;
if(Loader::includeModule('awz.bxapistats')){
    $tracker = \Awz\BxApiStats\Tracker::getInstance();
    $tracker->addCount();
}

$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('SmartList', 'OnEndBufferContent'), false, 999);

class SmartList extends IList implements IParams {

    public static $smartId;
    public static $usersCache = [];

    public static function OnEndBufferContent(&$content){
        $content = str_replace('parent.BX.ajax.','window.awz_ajax_proxy.', $content);
    }

    public function __construct($params, $publicMode=false){

        if(!empty($params['SMART_FIELDS'])){
            \Awz\Admin\SmartTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        //$params['TABLEID'] = 'awz_smart_'.$params['SMART_ID'].'_'.$params['SMART_ID2'];

        $params = \Awz\Admin\Helper::addCustomPanelButton($params);

        parent::__construct($params, $publicMode);
    }

    public function addUsersFromAdminResult(array $items = []){
        foreach($items as $uid=>$item){
            self::$usersCache[$uid] = [
                    'id'=>$uid,
                    'name'=>$item['NAME'].' '.$item['LAST_NAME'],
                    'link'=>'/company/personal/user/'.$uid.'/',
                    'icon'=>$item['PERSONAL_PHOTO'] ?? '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2',
            ];
        }
    }

    public function getUserData(int $id = 0){
        if(isset(self::$usersCache[$id])) {
            return self::$usersCache[$id];
        }
        return [];
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

    public function getEntityCodeFromId(int $id, array $avalible = [1,2,3,4]): array
    {
        if(!in_array($id, $avalible)) return [];
        static $codesEntity = [];
        if(empty($codesEntity))
            $codesEntity = Helper::entityCodes();
        foreach($codesEntity as $ent){
            if($ent['ID'] == $id){
                return $ent;
            }
        }
        return [];
    }

    public function getEntityIdFromCode(string $code)
    {
        static $codesEntity = [];
        if(empty($codesEntity))
            $codesEntity = Helper::entityCodes();
        foreach($codesEntity as $ent){
            if($ent['CODE'] == $code){
                return (int) $ent['ID'];
            }
        }
    }

    public function trigerGetRowListAdmin($row){
        \Awz\Admin\Helper::defTrigerList($row, $this);
        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
        $primaryCode = $this->getParam('PRIMARY', 'ID');
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
            /*"ADD_GROUP_ACTIONS"=> [
                "edit",
                "delete"
            ],*/
            "ACTION_PANEL"=>[],
            "ADD_LIST_ACTIONS"=> [
                "delete",
                "edit_row"=> [
                    "ICON"=>"edit",
                    "DEFAULT"=>true,
                    "TEXT"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "TITLE"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "ACTION"=>'#PRIMARY#'
                ],
                "copy_row"=> [
                    "ICON"=>"edit",
                    "DEFAULT"=>true,
                    "TEXT"=>Loc::getMessage("MAIN_ADMIN_MENU_COPY"),
                    "TITLE"=>Loc::getMessage("MAIN_ADMIN_MENU_COPY"),
                    "ACTION"=>'#PRIMARY#'
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
                $this->addUsersFromAdminResult($results['users'] ?? []);
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
                if(($n-$ost) == 0) continue;
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

        $defPrm = ["SHOW_COUNT_HTML" => false];
        if($this->getParam('ADD_REQUEST_KEY')){
            $defPrm['ADD_REQUEST_KEY'] = $this->getParam('ADD_REQUEST_KEY');
        }
        if($this->getParam('ACTION_PANEL', [])){
            $defPrm['ACTION_PANEL'] = $this->getParam('ACTION_PANEL');
        }
        if($this->getParam('FIND')){
            $this->getAdminList()->DisplayFilter($this->getParam('FIND', array()));
        }

        $this->getAdminList()->DisplayList($defPrm);

        if($this->getParam('SMART_ID')){
            $gridOptions = new GridOptions($this->getParam('TABLEID'));
            $sort = $gridOptions->getSorting(['sort'=>['id'=>'desc']]);
            ?>
            <script type="text/javascript">

                $(document).ready(function(){
                    BX24.ready(function() {
                        BX24.init(function () {
                            window.awz_helper.gridUrl = window.location.pathname + window.location.search;
                            <?if(defined('CURRENT_CODE_PAGE')){?>
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/index.php?','/smarts/?');
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/?','/smarts/<?=CURRENT_CODE_PAGE?>.php?');
                            <?}?>
                            window.awz_helper.currentUserId = '<?=$this->getParam('CURRENT_USER')?>';
                            window.awz_helper.lastOrder = <?=\CUtil::PhpToJSObject($sort['sort'])?>;
                            window.awz_helper.fields = <?=\CUtil::PhpToJSObject($this->getParam('SMART_FIELDS'))?>;
                            window.awz_helper.filter_dates = <?=\CUtil::PhpToJSObject(\Awz\Admin\Helper::getDates())?>;
                            window.awz_helper.init(
                                '<?=$this->getParam('ADD_REQUEST_KEY')?>',
                                '<?=$this->getParam('SMART_ID')?>',
                                '<?=$this->getParam('TABLEID')?>',
                                <?=$this->getAdminList()->getNavSize()?>,
                                <?=\CUtil::PhpToJSObject($this->getParam('GRID_OPTIONS'))?>
                            );
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
$appId = 'app.63d6b637131902.97765356';
if($request->get('app')){
    $appId = $request->get('app');
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
$checkAuthGroupId = false;

$s_id = $app->getRequest()->get('key');
if($s_id){
    $tmp = explode("|", $s_id);
    if(count($tmp)<5) {
        $s_id = '';
    }else{
        $hashPrepare = array_pop($tmp);
        $hash = hash_hmac('sha256', implode("|",$tmp), $app->getConfig('APP_SECRET_CODE'));
        if($hash != $hashPrepare) $s_id = '';
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
        if(count($tmp)==5){
            $checkAuthGroupId = $tmp[4];
        }
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

$checkAuthGroupId = $placement['GROUP_ID'] ?? "";

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <?
    if($checkAuth){
        CJsCore::init('jquery');
        CJSCore::Init(array('popup', 'date'));
        Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
        Asset::getInstance()->addJs("/bx24/smarts/scriptn.js");
        Asset::getInstance()->addJs("/bx24/smarts/md5.js");
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
    if($request->get('h_ID')){
        $resTokenRight = \Awz\BxApi\Api\Controller\SmartApp::checkUserRightHook(
            $checkAuthDomain, $app->getConfig('APP_ID'), $request->get('h_ID'), $checkAuthMember
        );
        if(!$resTokenRight->isSuccess()){
            $loadParamsEntity->addErrors($resTokenRight->getErrors());
        }
    }
    if($loadParamsEntity->isSuccess()){
        $loadParamsEntityData = $loadParamsEntity->getData();
        $gridOptions = $loadParamsEntityData['options'];

        $arParams['GRID_OPTIONS'] = $gridOptions;
        $arParams['GRID_OPTIONS']['method_list'] = 'crm.item.list';
        $arParams['GRID_OPTIONS']['method_delete'] = 'crm.item.delete';
        $arParams['GRID_OPTIONS']['method_update'] = 'crm.item.update';
        $arParams['GRID_OPTIONS']['method_add'] = 'crm.item.add';
        $arParams['GRID_OPTIONS']['result_key'] = 'items';
        $arParams['SMART_ID'] = $gridOptions['PARAM_1'] ?? "";
        if($arParams['SMART_ID']) $arParams['SMART_ID'] = str_replace('DYNAMIC_','',$arParams['SMART_ID']);
    }
    if($arParams['SMART_ID'] && $loadParamsEntity->isSuccess()){

        $arParams['ADD_REQUEST_KEY'] = $checkAuthKey.'|'.$checkAuthDomain.'|'.$checkAuthMember.'|'.$app->getConfig('APP_ID');
        $arParams['CURRENT_USER'] = $checkAuthMember;
        $hash = hash_hmac('sha256', $arParams['ADD_REQUEST_KEY'], $app->getConfig('APP_SECRET_CODE'));
        $arParams['ADD_REQUEST_KEY'] .= '|'.$hash;
        $app->getRequest()->addFilter(new SetFilter('key', $arParams['ADD_REQUEST_KEY']));

        if($tracker){
            $tracker->setPortal($checkAuthDomain)
                ->setAppId($app->getConfig('APP_ID'));
        }

        $cacheId = $app->getRequest()->get('DOMAIN').'fields_bagsmart_'.md5(serialize($arParams['GRID_OPTIONS']));

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

            $app->setCacheParams($cacheId);
            $bxRowsResFields = $app->postMethod('crm.item.fields.json', array(
                'entityTypeId'=>$arParams['SMART_ID'],
            ));
            if($bxRowsResFields->isSuccess()) {
                $bxFields = $bxRowsResFields->getData();
                $allFields = $bxFields['result']['result']['fields'];

                $app->setCacheParams($cacheId.'_3');
                $categoryRes = $app->postMethod('crm.category.list.json', array(
                    "entityTypeId"=>$arParams['SMART_ID'],
                ));
                $stagesIds = [];
                if($categoryRes->isSuccess()) {
                    $scategoryData = $categoryRes->getData();
                    foreach($scategoryData['result']['result']['categories'] as $status){
                        $stagesIds[] = ['DYNAMIC_'.$status['entityTypeId'].'_STAGE_'.$status['id'], $status['name']];
                    }
                }
                //echo'<pre>';print_r($scategoryData);echo'</pre>';

                foreach($allFields as &$field){
                    if($field['type'] == 'crm_status'){
                        $values = [''=>'Не указано'];
                        $cnt = 0;
                        foreach($stagesIds as $row){
                            $cnt++;
                            if($cnt>5) break;
                            $app->setCacheParams($cacheId.'_'.(3+$cnt));
                            $statusRes = $app->postMethod('crm.status.list.json', array(
                                'order'=>["SORT"=>"ASC"],
                                'filter'=>["ENTITY_ID"=>$row[0]],
                            ));
                            if($statusRes->isSuccess()) {
                                $statusData = $statusRes->getData();
                                foreach($statusData['result']['result'] as $status){
                                    $values[$status['STATUS_ID']] = $row[1].': '.$status['NAME'];
                                }
                            }
                        }
                        $field['values'] = $values;
                    }
                    if($field['type'] == 'crm_category'){

                        $values = [''=>'Не указано'];
                        if($categoryRes->isSuccess()) {
                            $scategoryData = $categoryRes->getData();
                            foreach($scategoryData['result']['result']['categories'] as $status){
                                $values[$status['id']] = $status['name'];
                            }
                        }
                        $field['values'] = $values;
                        //echo'<pre>';print_r($scategoryData);echo'</pre>';
                    }
                    if($field['type'] == 'enumeration'){
                        $values = [''=>'Не указано'];
                        if(!empty($field['items'])){
                            foreach($field['items'] as $v){
                                if(!is_array($v)) continue;
                                if(!isset($v['ID'])) continue;
                                if(!isset($v['VALUE'])) continue;
                                $values[$v['ID']] = $v['VALUE'];
                            }
                        }
                        $field['values'] = $values;
                    }
                    if($field['type']=='crm_entity' && isset($field['settings']['parentEntityTypeId'])){
                        $codesEntity = Helper::entityCodes();
                        foreach($codesEntity as $ent){
                            if(!in_array($ent['ID'], [1,2,3,4])) continue;
                            if($ent['ID'] == $field['settings']['parentEntityTypeId']){
                                $field['type'] = 'crm_'.mb_strtolower($ent['CODE']);
                                break;
                            }
                        }
                    }
                    if($field['type']=='crm' && isset($field['settings']) && is_array($field['settings'])){
                        $codes = [];
                        foreach($field['settings'] as $code=>$act){
                            if($act === 'Y'){
                                if(in_array($code, ['COMPANY','DEAL','LEAD','CONTACT'])){
                                    $codes[] = $code;
                                }
                            }
                        }
                        if(count($codes) == 1){
                            $field['type'] = 'crm_'.mb_strtolower($codes[0]);
                        }
                    }
                }
                unset($field);


                $arParams['SMART_FIELDS'] = $allFields;

                //echo'<pre>';print_r($arParams['SMART_FIELDS']);echo'</pre>';
                //die();

                $app->setCacheParams($cacheId.'_1');
                $bxRowsResActions = $app->postMethod('crm.type.list', ['filter'=>['title'=>'Умный смарт']]);
                if($bxRowsResActions->isSuccess()){
                    $bxActions = $bxRowsResActions->getData();
                    if(isset($bxActions['result']['result']['types'][0]['id'])){
                        $app->setCacheParams($cacheId.'_2');
                        $bxRowsResActionsFields = $app->postMethod('crm.item.fields', ['entityTypeId'=>$bxActions['result']['result']['types'][0]['entityTypeId']]);
                        if($bxRowsResActionsFields->isSuccess()){
                            $bxActionsFields = $bxRowsResActionsFields->getData();
                            if(!empty($bxActionsFields['result']['result']['fields'])){
                                $arParams['CLEVER_FIELDS'] = $bxActionsFields['result']['result']['fields'];
                                $arParams['CLEVER_SMART'] = $bxActions['result']['result']['types'][0];
                            }
                        }else{
                            $app->cleanCache($cacheId.'_2');
                        }
                    }
                }else{
                    $app->cleanCache($cacheId.'_1');
                }
            }else{
                $app->cleanCache($cacheId);
                $loadParamsEntity->addErrors($bxRowsResFields->getErrors());
            }
        }
    }
    if($arParams['SMART_ID'] && !$customPrint && $loadParamsEntity->isSuccess()){
        PageList::$smartId = $arParams['SMART_ID'];
        $adminCustom = new PageList($arParams, true);

        $fields = \Awz\Admin\SmartTable::getMap();
        $addFilters = [];
        foreach($fields as $obField){
            \Awz\Admin\Helper::addFilter($arParams, $obField);
            if(!($obField instanceof \Bitrix\Main\ORM\Fields\StringField)){
                $addFilters[] = [
                    'id'=>$obField->getColumnName().'_str',
                    'realId'=>$obField->getColumnName(),
                    'name'=>$obField->getTitle().' [строка]',
                    'type'=>'string'
                ];
            }
        }
        foreach($arParams['FIND'] as &$field){
            if($field['id'] == 'stageId'){
                $field['params']['multiple'] = 'Y';
            }
        }
        foreach($addFilters as $f){
            $arParams['FIND'][] = $f;
        }

        $arParams['ACTION_PANEL'] = [
            "GROUPS"=>[
                [
                    "ITEMS"=>[
                        \Awz\Admin\Helper::getGroupAction('edit'),
                        \Awz\Admin\Helper::getGroupAction('delete')
                    ]
                ]
            ]
        ];

        \Awz\Admin\Helper::setCleverSmartParams($arParams, $checkAuthMember, $adminCustom);
        \Awz\Admin\Helper::setFieldsActionParams($arParams, $fields, $adminCustom);
        \Awz\Admin\Helper::setDeleteActionParams($arParams, $adminCustom);
        \Awz\Admin\Helper::setAddActionParams($arParams, $adminCustom);

        \Bitrix\Main\UI\Extension::load("ui.progressbar");
        \Bitrix\Main\UI\Extension::load('ui.entity-selector');
        \Bitrix\Main\UI\Extension::load('ui.forms');
        \Bitrix\Main\UI\Extension::load('ui.alerts');
        \Bitrix\Main\UI\Extension::load('ui.layout-form');
        $adminCustom->setParam('ACTION_PANEL', $arParams['ACTION_PANEL']);
        $adminCustom->setParam('FIND',$adminCustom->formatFilterFields($arParams['FIND']));
        $adminCustom->defaultInterface();
    }
    if(!$arParams['SMART_ID'] && !$customPrint){
        $loadParamsEntity->addError(new \Bitrix\Main\Error("Сущность не найдена"));
        ?>
        <div class="container"><div class="row"><div class="ui-block-wrapper">
                    <?
                    echo Helper::errorsHtmlFromText(
                        $loadParamsEntity->getErrorMessages(),
                        'Ошибка получения сущности');?>
                </div></div></div>
        <?
    }
}
?>
</body>
</html>
<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");