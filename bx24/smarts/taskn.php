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
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('TaskList', 'OnEndBufferContent'), false, 999);

class TaskList extends IList implements IParams {

    public static $smartId;
    public static $usersCache = [];

    public static function OnEndBufferContent(&$content){
        $content = str_replace('parent.BX.ajax.','window.awz_ajax_proxy.', $content);
    }

    public function __construct($params, $publicMode=false){

        if(!empty($params['SMART_FIELDS'])){
            \Awz\Admin\TaskTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        //$params['TABLEID'] = 'awz_smart_'.$params['SMART_ID'].'_'.$params['SMART_ID2'];
        $params = \Awz\Admin\Helper::addCustomPanelButton($params);
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

    public function addUsersFromAdminResult(array $items = []){
        foreach($items as $item){
            if(isset($item['creator']) && is_array($item['creator']) && $item['creator']['id']){
                self::$usersCache[intval($item['creator']['id'])] = $item['creator'];
            }
            if(isset($item['responsible']) && is_array($item['responsible']) && $item['responsible']['id']){
                self::$usersCache[intval($item['responsible']['id'])] = $item['responsible'];
            }
        }
    }

    public function getUserData(int $id = 0){
        //print_r(self::$usersCache);
        //die();
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
                }else{
                    $userData = $this->getUserData($id);
                    if(isset($userData['name'])){
                        $users[$id] = $userData['name'];
                    }
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
        $primaryCode = $this->getParam('PRIMARY', 'ID');

        foreach($fields as $fieldCode=>$fieldData){
            if(false && $fieldData['type'] == 'crm'){
                if(!$fieldData['isReadOnly']) {
                    $row->AddInputField($fieldCode, array("size" => $fieldData['settings']['SIZE']));
                }else{
                    $row->AddViewField($fieldCode, $row->arRes[$fieldCode]);
                }
                if($fieldData['isMultiple']){
                    $value = '';
                    if(empty($row->arRes[$fieldCode]) || $row->arRes[$fieldCode] == 'false'){
                        $row->AddViewField($fieldCode, '');
                        $row->arRes[$fieldCode] = '';
                    }elseif(!empty($row->arRes[$fieldCode])){
                        $viewedAr = [];
                        foreach($row->arRes[$fieldCode] as $val){
                            $viewedAr[] = \Awz\Admin\Helper::createCrmLink($val);
                        }
                        $row->AddViewField($fieldCode, implode(", ",$viewedAr));
                        $value = implode(',',$row->arRes[$fieldCode]);
                    }
                    if(!empty($this->getParam('EXT_PARAMS', []))){

                    }else{
                        $editId = $fieldCode.'_'.$row->arRes[$primaryCode];
                        $fieldHtml = '<div class="wrp" id="'.$editId.'"><input style="width:80%;" value="'.$value.'" name="'.$fieldCode.'" class="main-grid-editor main-grid-editor-text" id="'.$fieldCode.'_control"/><button class="ui-btn ui-btn-xs ui-btn-light-border" onclick="window.awz_helper.openDialogCrm(\''.$editId.' input\',\'deal,lead,contact,company\');return false;">...</button></div>';
                        $row->AddEditField($fieldCode, $fieldHtml);
                    }
                }
            }
        }
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
            "ENTITY" => "\\Awz\\Admin\\TaskTable",
            "BUTTON_CONTEXTS"=>[
                [
                    'add'=> [
                        'TEXT' => 'Новая задача',
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
                "summ"=>[
                     'key'=>"summ","title"=>"Посчитать сумму"
                ]
            ],*/
            "ADD_LIST_ACTIONS"=> [
                "delete",
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
                $this->addUsersFromAdminResult($results['tasks'] ?? []);
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
        if(isset($res['tasks'])){
            foreach ($res['tasks'] as $row){
                if(empty($row)) continue;

                //echo'<pre>';print_r($row);echo'</pre>';
                $n++;
                //$row['id'] = 'n: '.$n.', ost: '.$ost.', pageSize: '.$pageSize;
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
                            window.awz_helper.gridUrl = window.location.pathname + window.location.search;
                            <?if(defined('CURRENT_CODE_PAGE')){?>
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/index.php?','/smarts/?');
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/?','/smarts/<?=CURRENT_CODE_PAGE?>.php?');
                            <?}?>
                            <?
                            $groups = $this->getFromCache('groups');
                            $gridOptions = new GridOptions($this->getParam('TABLEID'));
                            $sort = $gridOptions->getSorting(['sort'=>['ID'=>'desc']]);
                            $_EXT_PARAMS = $this->getParam('EXT_PARAMS');
                            ?>
                            <?if($groupId = $this->getParam('GROUP_ID')){?>
                            window.awz_helper.addFilter = {'GROUP_ID':'<?=$groupId?>'};
                            <?}?>
                            <?if(isset($_EXT_PARAMS[1])){?>window.awz_helper.extUrl = '<?=$_EXT_PARAMS[1]?>';<?}?>
                            window.awz_helper.currentUserId = '<?=$this->getParam('CURRENT_USER')?>';
                            window.awz_helper.lastOrder = <?=\CUtil::PhpToJSObject($sort['sort'])?>;
                            window.awz_helper.groups = <?=\CUtil::PhpToJSObject($groups)?>;
                            window.awz_helper.fields = <?=\CUtil::PhpToJSObject($this->getParam('SMART_FIELDS'))?>;
                            window.awz_helper.fields_select = <?=\CUtil::PhpToJSObject($this->getParam('SMART_FIELDS_SELECT'))?>;
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

use TaskList as PageList;

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
            $arParams['GRID_OPTIONS']['method_list'] = 'tasks.task.list';
            $arParams['GRID_OPTIONS']['method_delete'] = 'tasks.task.delete';
            $arParams['GRID_OPTIONS']['method_update'] = 'tasks.task.update';
            $arParams['GRID_OPTIONS']['method_add'] = 'tasks.task.add';
            $arParams['GRID_OPTIONS']['result_key'] = 'tasks';
            $arParams['SMART_ID'] = $gridOptions['PARAM_1'] ?? "";
            if(strpos($arParams['SMART_ID'], 'TASK_GROUP_')!==false){
                $arParams['GROUP_ID'] = str_replace('TASK_GROUP_','',$arParams['SMART_ID']);
                //$arParams['GRID_OPTIONS']['entityId'] = $arParams['GROUP_ID'];
            }
            if($arParams['SMART_ID'] === 'TASK_GROUPS' && $checkAuthGroupId){
                $arParams['GROUP_ID'] = $checkAuthGroupId;
                $arParams['GRID_OPTIONS']['g'] = $checkAuthGroupId;
            }
            //вшешние задачи
            if($extWebHook = $app->getRequest()->get('ext')){
                $arParams['EXT_PARAMS'] = [
                    'task',
                    'https://'.$extWebHook
                ];
            }
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

                if(!empty($arParams['EXT_PARAMS'])){
                    $bxRowsResFields = $app->postMethod($arParams['EXT_PARAMS'][1].'tasks.task.getFields');
                }else{
                    $bxRowsResFields = $app->postMethod('tasks.task.getFields');
                }

                if($bxRowsResFields->isSuccess()) {

                    $bxFields = $bxRowsResFields->getData();
                    $allFields = $bxFields['result']['result']['fields'];
                    //echo'<pre>';print_r($allFields);echo'</pre>';
                    if(isset($allFields['CREATED_BY'])){
                        $allFields['CREATED_BY']['type'] = 'user';
                    }
                    if(isset($allFields['RESPONSIBLE_ID'])){
                        $allFields['RESPONSIBLE_ID']['type'] = 'user';
                    }
                    if(isset($allFields['CHANGED_BY'])){
                        $allFields['CHANGED_BY']['type'] = 'user';
                    }
                    if(isset($allFields['CLOSED_BY'])){
                        $allFields['CLOSED_BY']['type'] = 'user';
                    }
                    if(isset($allFields['STATUS_CHANGED_BY'])){
                        $allFields['STATUS_CHANGED_BY']['type'] = 'user';
                    }
                    if(isset($allFields['GROUP_ID'])){
                        $allFields['GROUP_ID']['type'] = 'group';
                    }

                    $sortableField = [
                        'ID',
                        'TITLE',
                        'DATE_START',
                        'CREATED_DATE',
                        'CHANGED_DATE',
                        'CLOSED_DATE',
                        'DEADLINE',
                        'REAL_STATUS',
                        'STATUS_COMPLETE',
                        'PRIORITY',
                        'MARK',
                        'GROUP_ID',
                        'TIME_ESTIMATE',
                        'ALLOW_CHANGE_DEADLINE',
                        'ALLOW_TIME_TRACKING',
                        'MATCH_WORK_TIME',
                        'FAVORITE',
                        'SORTING',
                        'MESSAGE_ID'
                    ];
                    $disabledFields = [
                        'PARENT_ID',
                        'DESCRIPTION',
                        'ACCOMPLICES',
                        'AUDITORS',
                        'GUID',
                        'XML_ID',
                        'COMMENTS_COUNT',
                        'SERVICE_COMMENTS_COUNT',
                        'NEW_COMMENTS_COUNT',
                        'MATCH_WORK_TIME',
                        'FORUM_TOPIC_ID',
                        'FORUM_ID',
                        'SITE_ID',
                        'EXCHANGE_MODIFIED',
                        'EXCHANGE_ID',
                        'CHECKLIST',
                        'UF_TASK_WEBDAV_FILES',
                        'SORTING'
                    ];
                    $readOnlyFields = [
                        'NOT_VIEWED',
                        'FORKED_BY_TEMPLATE_ID',
                        'TIME_SPENT_IN_LOGS',
                        'SUBORDINATE',
                        'FAVORITE',
                        'OUTLOOK_VERSION',
                        'VIEWED_DATE',
                        'DURATION_FACT',
                        'DURATION_TYPE',
                        'IS_MUTED',
                        'IS_PINNED',
                        'IS_PINNED_IN_GROUP',
                    ];
                    if($arParams['GROUP_ID']){
                        //$disabledFields[] = 'GROUP_ID';
                    }

                    $app->setCacheParams($cacheId.'_0');
                    if($arParams['GROUP_ID']){
                        $bxRowsResStages = $app->postMethod('task.stages.get', ['entityId'=>$arParams['GROUP_ID']]);
                    }else{
                        $bxRowsResStages = $app->postMethod('task.stages.get', ['entityId'=>0]);
                    }

                    if($bxRowsResStages->isSuccess()){
                        $bxStages = $bxRowsResStages->getData();
                        if(!empty($bxStages['result']['result'])){
                            $allFields['STAGE_ID']['values'] = [];
                            $allFields['STAGE_ID']['type'] = 'enum';
                            foreach($bxStages['result']['result'] as $stage){
                                $allFields['STAGE_ID']['values'][$stage['ID']] = $stage['TITLE'];
                            }
                        }
                    }else{
                        $disabledFields[] = 'STAGE_ID';
                        $app->cleanCache($cacheId.'_0');
                    }

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

                    $newFormatFields = [];
                    $selectFormatFields = [];
                    foreach($allFields as $key=>$val){
                        if(in_array($key, $disabledFields)) continue;
                        if(in_array($key, $readOnlyFields)){
                            $val['isReadOnly'] = true;
                        }
                        if(in_array($key, $sortableField)){
                            $val['sort'] = $key;
                        }else{
                            $val['sort'] = false;
                        }
                        if($key=='STATUS'){
                            $val['sort'] = 'REAL_STATUS';
                        }
                        $val['upperCase'] = $key;
                        if($key == 'UF_CRM_TASK')
                            $val['isMultiple'] = true;
                        $key = lcfirst(\Bitrix\Main\Text\StringHelper::snake2camel($key));
                        $newFormatFields[$key] = $val;
                        $selectFormatFields[] = $val['upperCase'];
                    }

                    unset($allFields);
                    $arParams['SMART_FIELDS'] = $newFormatFields;
                    $arParams['SMART_FIELDS_SELECT'] = $selectFormatFields;

                }else{
                    $loadParamsEntity->addErrors($bxRowsResFields->getErrors());
                    $app->cleanCache($cacheId);
                }

            }

        }
        if($arParams['SMART_ID'] && !$customPrint && $loadParamsEntity->isSuccess()){
            PageList::$smartId = $arParams['SMART_ID'];
            $adminCustom = new PageList($arParams, true);

            $fields = \Awz\Admin\TaskTable::getMap();
            $addFilters = [];
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
                if($arParams['GROUP_ID'] && $obField->getColumnName()=='groupId') {
                    continue;
                }
                if($obField instanceof \Bitrix\Main\ORM\Fields\IntegerField){
                    if($arParams['SMART_FIELDS'][$obField->getColumnName()]['type']=='group'){
                        $groups = PageList::getFromCacheSt('groups', $arParams['ADD_REQUEST_KEY']);
                        $arParams['SMART_FIELDS'][$obField->getColumnName()]['items'] = $groups;
                    }
                }
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
                //echo'<pre>';print_r($field);echo'</pre>';
                if($field['id'] == 'STATUS'){
                    $field['params']['multiple'] = 'Y';
                }
            }
            foreach($addFilters as $f){
                $arParams['FIND'][] = $f;
            }
            //die();

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


            //if(empty($arParams['EXT_PARAMS'])){
                \Awz\Admin\Helper::setCleverSmartParams($arParams, $checkAuthMember, $adminCustom);
                \Awz\Admin\Helper::setFieldsActionParams($arParams, $fields, $adminCustom);
                \Awz\Admin\Helper::setDeleteActionParams($arParams, $adminCustom);
                \Awz\Admin\Helper::setAddActionParams($arParams, $adminCustom);
            //}

            /*
            $createItemAction['ITEMS'][] = [
                'NAME'=>'Создать элемент',
                'VALUE'=>'add_entity',
                'ONCHANGE'=>[
                    ['ACTION'=>'RESET_CONTROLS'],
                    [
                        'ACTION'=>'CREATE',
                        'DATA'=>[
                            [
                                'TYPE'=>'DROPDOWN',
                                'ID'=>'entityId',
                                'NAME'=>'entityId',
                                'TEXT'=>'Смарт процесс',
                                'ITEMS'=>[
                                    [
                                        'NAME'=>'test',
                                        'VALUE'=>'test',
                                        'ONCHANGE'=>[
                                            ['ACTION'=>'RESET_CONTROLS']
                                        ]
                                    ],
                                    [
                                        'NAME'=>'test2',
                                        'VALUE'=>'test2',
                                        'ONCHANGE'=>[
                                            ['ACTION'=>'RESET_CONTROLS'],
                                            [
                                                'ACTION'=>'CALLBACK',
                                                'DATA'=>[
                                                    //['JS'=>"alert('test2')"]
                                                ]
                                            ]
                                        ]
                                    ],
                                ]
                            ],
                            [
                                'TYPE'=>'CHECKBOX',
                                'ID'=>'apply_button_for_all',
                                'TEXT'=>' все ид',
                                'TITLE'=>' все ид',
                                'LABEL'=>' все ид',
                                'CLASS'=>'main-grid-panel-control',
                                'ONCHANGE'=>[
                                    ['ACTION'=>'RESET_CONTROLS']
                                ]
                            ],
                            [
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
                            ],
                            [
                                'TYPE'=>'BUTTON',
                                'ID'=>'open_crm_dialog',
                                'CLASS'=>'cansel',
                                'TEXT'=>'...',
                                'ONCHANGE'=>[
                                    [
                                        'ACTION'=>'CALLBACK',
                                        'DATA'=>[
                                            ['JS'=>"window.awz_helper.openDialogCrm('crm_entry_control')"]
                                        ]
                                    ]
                                ]
                            ],
                            [
                                'TYPE'=>'CUSTOM',
                                'ID'=>'apply_button_for_all',
                                'TEXT'=>'для всех',
                                'TITLE'=>'для всех',
                                'LABEL'=>'для всех',
                                'CLASS'=>'apply',
                                'VALUE'=>'<div class="test">test</div>',
                                'ONCHANGE'=>[
                                    ['ACTION'=>'RESET_CONTROLS']
                                ]
                            ],
                            [
                                'TYPE'=>'BUTTON',
                                'ID'=>'apply_button',
                                'CLASS'=>'apply',
                                'TEXT'=>'Применить',
                                'ONCHANGE'=>[
                                    [
                                        'ACTION'=>'CALLBACK',
                                        'DATA'=>[
                                            ['JS'=>"window.awz_helper.applyButton('add_entity')"]
                                        ]
                                    ]
                                ]
                            ],
                            [
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
                            ]
                        ]
                    ]
                ]
            ];
            */



            //echo'<pre>';print_r($arParams['ACTION_PANEL']);echo'</pre>';
            //die();
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