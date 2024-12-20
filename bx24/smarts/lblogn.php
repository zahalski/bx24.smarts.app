<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/interface/admin_list.php');
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/interface/admin_lib.php');
//header("Access-Control-Allow-Origin: *");

use Awz\Admin\Grid\Option as GridOptions;
use Awz\Admin\IList;
use Awz\Admin\IParams;
use Awz\BxApi\Api\Filters\Request\SetFilter;
use Awz\BxApi\TokensTable;
use Bitrix\Main\Data\Cache;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Awz\BxApi\App;
use Awz\BxApi\Helper;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Application;
use Awz\BxApi\Api\Filters\Request\ParseHook;

if(!Loader::includeModule('awz.bxapi')){
    return;
}
if(!Loader::includeModule('awz.admin')){
    return;
}

$request = Application::getInstance()->getContext()->getRequest();
$request->addFilter(new ParseHook());

$tracker = null;
if(Loader::includeModule('awz.bxapistats')){
    $tracker = \Awz\BxApiStats\Tracker::getInstance();
    $tracker->addCount();
}

$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('LBlog', 'OnEndBufferContent'), false, 999);

class LBlog extends IList implements IParams {

    public static $smartId;

    public static function OnEndBufferContent(&$content){
        $content = str_replace('parent.BX.ajax.','window.awz_ajax_proxy.', $content);
    }

    public function __construct($params, $publicMode=false){

        if(!empty($params['SMART_FIELDS'])){
            \Awz\Admin\UnoTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        //$params['TABLEID'] = 'awz_smart__1_'.$params['SMART_ID'].'__2_'.$params['SMART_ID2'];

        parent::__construct($params, $publicMode);
    }

    public static function getFromCacheSt($key, $keyapi){
        $addKey = explode('|',$keyapi);
        $cacheDir = '/awz/bxapi/'.$addKey[3];

        $obCache = Cache::createInstance();
        if($obCache->initCache(86400000,md5(implode([$addKey,$key])),$cacheDir)){
            $res = $obCache->getVars();
            if(!empty($res)) return $res;
        }
        return array();
    }
    public function getFromCache($key){
        return self::getFromCacheSt($key, $this->getParam('ADD_REQUEST_KEY'));
    }

    public function setCache($key, $data){

        $addKey = explode('|',$this->getParam('ADD_REQUEST_KEY'));
        $cacheDir = '/awz/bxapi/'.$addKey[3];

        $obCache = Cache::createInstance();
        $obCache->clean(md5(implode([$addKey,$key])), $cacheDir);
        if($obCache->initCache(86400000,md5(implode([$addKey,$key])),$cacheDir)){
        }else if($obCache->startDataCache()){
            $obCache->endDataCache($data);
        }
        return $data;

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

    public function getGroup(int $id = 0)
    {
        static $groups = array();

        if(empty($groups)){
            $request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
            if($bx_result = $request->getPost('bx_result')){
                if(isset($bx_result['groups'][$id])) {
                    $groups = $this->setCache('groups',$bx_result['groups']);
                }
            }
        }
        if(empty($groups)){
            $groups = $this->getFromCache('groups');
        }

        return $groups[$id] ?? array();
    }

    public function trigerGetRowListAdmin($row){
        \Awz\Admin\Helper::defTrigerList($row, $this);

        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
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
            "PRIMARY"=>"ID",
            "ENTITY" => "\\Awz\\Admin\\UnoTable",
            "BUTTON_CONTEXTS"=>[
                /*[
                    'add'=> [
                        'TEXT' => 'Добавить',
                        'ICON' => '',
                        'LINK' => '',
                        'ONCLICK' => 'window.awz_helper.menuNewEl();return false;',
                    ]
                ],*/
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
                "summ"=>[
                     'key'=>"summ","title"=>"Посчитать сумму"
                ]
            ],*/
            "ADD_LIST_ACTIONS"=> [
                //"delete",
                /*"edit_row"=> [
                    "ICON"=>"edit",
                    "DEFAULT"=>true,
                    "TEXT"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "TITLE"=>Loc::getMessage("MAIN_ADMIN_MENU_EDIT"),
                    "ACTION"=>'#PRIMARY#'
                ],*/
                /*"copy_row"=> [
                    "ICON"=>"edit",
                    "DEFAULT"=>true,
                    "TEXT"=>Loc::getMessage("MAIN_ADMIN_MENU_COPY"),
                    "TITLE"=>Loc::getMessage("MAIN_ADMIN_MENU_COPY"),
                    "ACTION"=>'#PRIMARY#'
                ]*/
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
        if($this->getParam('ACTION_PANEL')){
            $defPrm['ACTION_PANEL'] = $this->getParam('ACTION_PANEL');
        }

        if($this->getParam('FIND')){
            $this->getAdminList()->DisplayFilter($this->getParam('FIND', array()));
        }

        $this->getAdminList()->DisplayList($defPrm);

        if($this->getParam('SMART_ID')){
            ?>
            <script type="text/javascript">
                $(document).ready(function(){
                    BX24.ready(function() {
                        BX24.init(function () {
                            <?
                            $gridOptions = new GridOptions($this->getParam('TABLEID'));
                            $sort = $gridOptions->getSorting(['sort'=>[$this->getParam('PRIMARY') =>'desc']]);
                            $_EXT_PARAMS = $this->getParam('EXT_PARAMS');
                            ?>
                            <?if(isset($_EXT_PARAMS[1])){?>window.awz_helper.extUrl = '<?=$_EXT_PARAMS[1]?>';<?}?>
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
            die();
        }

    }
}

use LBlog as PageList;

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
//echo '<pre>';print_r($_REQUEST);echo '</pre>';
//die();

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
    if($loadParamsEntity->isSuccess()){
        $loadParamsEntityData = $loadParamsEntity->getData();
        $gridOptions = $loadParamsEntityData['options'];

        $arParams['GRID_OPTIONS'] = $gridOptions;
        $arParams['GRID_OPTIONS']['method_list'] = 'log.blogpost.get';
        $arParams['GRID_OPTIONS']['result_key'] = '';
        $arParams['SMART_ID'] = $gridOptions['PARAM_1'] ?? "";
        //внешняя лента
        if($extWebHook = $app->getRequest()->get('ext')){
            $arParams['EXT_PARAMS'] = [
                'lblog',
                'https://'.$extWebHook
            ];
        }
    }

    //TASK_GROUP_
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

        $cacheId = $app->getRequest()->get('DOMAIN').'_fields_bagsmart_'.md5(serialize($arParams['GRID_OPTIONS']));

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
            $bxRowsResFields = new \Bitrix\Main\Result;

            $allFields = [
                'ID'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид',
                    'sort'=>false
                ],
                'TITLE'=>[
                    'type'=>'string',
                    'isReadOnly'=>1,
                    'title'=>'Название',
                    'sort'=>false
                ],
                'DATE_PUBLISH'=>[
                    'type'=>'datetime',
                    'isReadOnly'=>1,
                    'title'=>'Дата создания',
                    'sort'=>false
                ],
            ];
            $arParams['GRID_OPTIONS']['active_fields'] = array_keys($allFields);

            if($bxRowsResFields->isSuccess()){
                $bxRowsResFieldsData = $bxRowsResFields->getData();

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

                $arParams['SMART_FIELDS'] = $allFields;

            }else{
                $app->cleanCache($cacheId);
                $loadParamsEntity->addErrors($bxRowsResFields->getErrors());
            }

        }
        //echo'<pre>';print_r($bxRowsResFields);echo'</pre>';
    }
    if($arParams['SMART_ID'] && !$customPrint && $loadParamsEntity->isSuccess()){
        PageList::$smartId = $arParams['SMART_ID'];
        $adminCustom = new PageList($arParams, true);

        $fields = \Awz\Admin\UnoTable::getMap();
        foreach($fields as $obField){
            /*if($obField instanceof \Bitrix\Main\ORM\Fields\IntegerField){
                if($arParams['SMART_FIELDS'][$obField->getColumnName()]['type']=='group'){
                    $groups = PageList::getFromCacheSt('groups', $arParams['ADD_REQUEST_KEY']);
                    $arParams['SMART_FIELDS'][$obField->getColumnName()]['items'] = $groups;
                }
            }*/
            \Awz\Admin\Helper::addFilter($arParams, $obField);
        }
        foreach($arParams['FIND'] as &$field){
            if($field['id'] == 'STATUS'){
                $field['params']['multiple'] = 'Y';
            }
        }

        $arParams['ACTION_PANEL'] = [
            "GROUPS"=>[
                [
                    "ITEMS"=>[
                        //\Awz\Admin\Helper::getGroupAction('edit'),
                        //\Awz\Admin\Helper::getGroupAction('delete')
                    ]
                ]
            ]
        ];

        if(!empty($arParams['CLEVER_FIELDS'])){

            $createItemAction = [
                'TYPE'=>'DROPDOWN',
                'ID' => 'base_action_select',
                'NAME' => 'action_button_awz_s',
                'ITEMS'=>[]
            ];
            $createItemAction['ITEMS'][] = [
                'NAME'=>'- действия -',
                'VALUE'=>'default',
                'ONCHANGE'=>[
                    ['ACTION'=>'RESET_CONTROLS']
                ]
            ];
            $fieldid = 'ufCrm'.$arParams['CLEVER_SMART']['id'].'Controls';
            $fieldid2 = 'ufCrm'.$arParams['CLEVER_SMART']['id'].'Params';

            if(!empty($arParams['CLEVER_FIELDS'][$fieldid]['items'])){
                $generatedItem = [];
                foreach($arParams['CLEVER_FIELDS'][$fieldid]['items'] as $itm){

                    //Генерация отчета|Y|1|deal,contact,company|216,218|AWZ_SMART_TASK_USER_CRM_LEAD_LIST_TOOLBAR
                    /*
                     * 0 название действия
                     * 1 разрешить для всех элементов по фильтру
                     * 2 ид пользователя
                     * 3 crm сущности для выбора (lead,contact,company,deal,quote)
                     * 4 ид доступных параметров
                     * 5 ид грида
                     * */

                    $tmp = explode('|',$itm['VALUE']);
                    $tmp[2] = explode(',',$tmp[2]);
                    $tmp[3] = explode(',',$tmp[3]);
                    $tmp[4] = explode(',',$tmp[4]);
                    //echo'<pre>';print_r($tmp);echo'</pre>';
                    //die();
                    $itmParams = [
                        'name'=>$tmp[0],
                        'showAll'=>$tmp[1] == 'Y',
                        'users'=>$tmp[2],
                        'crm'=>$tmp[3],
                        'params'=>$tmp[4],
                        'grid'=>$tmp[5]
                    ];
                    if(!$itmParams['grid']){
                        $itmParams['grid'] = $adminCustom->getParam('TABLEID');
                    }
                    if(empty($itmParams['users'])){
                        $itmParams['users'][] = $checkAuthMember;
                    }
                    $checkGridName = false;
                    $gridPrepare = preg_replace('/([^0-9a-z_*[]{},()|])/','',strtolower($itmParams['grid']));
                    $gridPrepare = str_replace('*','.*',$gridPrepare);
                    $regex = '/^('.$gridPrepare.')$/is';
                    if(strtolower($itmParams['grid']) == strtolower($adminCustom->getParam('TABLEID'))){
                        $checkGridName = true;
                    }elseif(preg_match($regex,strtolower($adminCustom->getParam('TABLEID')))){
                        $itmParams['grid'] = $adminCustom->getParam('TABLEID');
                        $checkGridName = true;
                    }
                    if(!$checkGridName) continue;
                    if(!in_array($checkAuthMember, $itmParams['users'])) continue;


                    $generatedItem['NAME'] = $itmParams['name'];
                    $generatedItem['VALUE'] = 'control_'.$itm['ID'];
                    $generatedItem['ONCHANGE'] = [
                        ['ACTION'=>'RESET_CONTROLS'],
                        [
                            'ACTION'=>'CREATE',
                            'DATA'=>[]
                        ]
                    ];
                    $dopActions = [];
                    if(!empty($arParams['CLEVER_FIELDS'][$fieldid2]['items'])){
                        foreach($arParams['CLEVER_FIELDS'][$fieldid2]['items'] as $dItm){
                            if(!in_array($dItm['ID'], $itmParams['params'])) continue;
                            $dopActions[] = [
                                'NAME'=>$dItm['VALUE'],
                                'VALUE'=>'param_'.$dItm['ID'],
                            ];
                        }
                    }

                    if(!empty($dopActions)){

                        $values = [
                            [
                                'NAME'=>'- параметр -',
                                'VALUE'=>'default',
                                'ONCHANGE'=>[
                                    ['ACTION'=>'RESET_CONTROLS']
                                ]
                            ]
                        ];
                        foreach($dopActions as $tmp){
                            $values[] = $tmp;
                        }

                        $generatedItem['ONCHANGE'][1]['DATA'][] = [
                            'TYPE'=>'DROPDOWN',
                            'ID'=>'paramId',
                            'NAME'=>'paramId',
                            'TEXT'=>'Доп. параметр',
                            'ITEMS'=>$values
                        ];
                    }

                    if($itmParams['showAll']){
                        $generatedItem['ONCHANGE'][1]['DATA'][] = [
                            'TYPE'=>'CHECKBOX',
                            'ID'=>'apply_button_for_all',
                            'TEXT'=>' все ид',
                            'TITLE'=>' все ид',
                            'LABEL'=>' все ид',
                            'CLASS'=>'main-grid-panel-control',
                            'ONCHANGE'=>[
                                ['ACTION'=>'RESET_CONTROLS']
                            ]
                        ];
                    }
                    if(!empty($itmParams['crm'])){
                        $generatedItem['ONCHANGE'][1]['DATA'][] = [
                            'TYPE'=>'TEXT',
                            'ID'=>'crm_entry',
                            'NAME'=>'crm_entry',
                            'CLASS'=>'apply',
                            'ONCHANGE'=>[
                                ['ACTION'=>'RESET_CONTROLS'],
                                [
                                    'ACTION'=>'CALLBACK',
                                    'DATA'=>[
                                        ['JS'=>"window.awz_helper.openDialogCrm()"]
                                    ]
                                ]
                            ]
                        ];
                        $generatedItem['ONCHANGE'][1]['DATA'][] = [
                            'TYPE'=>'BUTTON',
                            'ID'=>'open_crm_dialog',
                            'CLASS'=>'cansel',
                            'TEXT'=>'...',
                            'ONCHANGE'=>[
                                [
                                    'ACTION'=>'CALLBACK',
                                    'DATA'=>[
                                        ['JS'=>"window.awz_helper.openDialogCrm('crm_entry_control','".implode(',', $itmParams['crm'])."')"]
                                    ]
                                ]
                            ]
                        ];
                    }


                    $generatedItem['ONCHANGE'][1]['DATA'][] = [
                        'TYPE'=>'BUTTON',
                        'ID'=>'apply_button',
                        'CLASS'=>'apply',
                        'TEXT'=>'Применить',
                        'ONCHANGE'=>[
                            [
                                'ACTION'=>'CALLBACK',
                                'DATA'=>[
                                    ['JS'=>"window.awz_helper.applyButton('add_item','".$arParams['CLEVER_SMART']['entityTypeId']."','".$arParams['CLEVER_SMART']['id']."')"]
                                ]
                            ]
                        ]
                    ];
                    $generatedItem['ONCHANGE'][1]['DATA'][] = [
                        'TYPE'=>'BUTTON',
                        'ID'=>'cansel_button',
                        'CLASS'=>'main-grid-buttons cancel',
                        'TEXT'=>'Отменить',
                        'ONCHANGE'=>[
                            [
                                'ACTION'=>'CALLBACK',
                                'DATA'=>[
                                    ['JS'=>"window.awz_helper.canselGroupActions()"]
                                ]
                            ]
                        ]
                    ];

                    $createItemAction['ITEMS'][] = $generatedItem;
                }

            }
            if(count($createItemAction['ITEMS'])>1)
                $arParams['ACTION_PANEL']['GROUPS'][0]['ITEMS'][] = $createItemAction;
        }

        \Bitrix\Main\UI\Extension::load("ui.progressbar");
        \Bitrix\Main\UI\Extension::load('ui.entity-selector');
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