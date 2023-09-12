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
use Bitrix\Main\Localization\Loc;
use Awz\BxApi\App;
use Awz\BxApi\Helper;
use Bitrix\Main\Web\Json;
include_once(__DIR__.'/include/load_modules.php');
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
                            <?if($prefilter = $this->getParam('GRID_OPTIONS_PREFILTER')){?>
                            window.awz_helper.addFilter = <?=\CUtil::PhpToJSObject($prefilter)?>;
                            <?}?>
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

global $APPLICATION;
include_once(__DIR__.'/include/app_auth.php');
/* @var App $app */
/* @var $checkAuth */
/* @var $checkAuthKey */
/* @var $checkAuthDomain */
/* @var $checkAuthMember */
/* @var $checkAuthAppId */
/* @var bool $customPrint */

$placement = $app->getRequest()->get('PLACEMENT_OPTIONS');
if($placement) {
    $placement = Json::decode($placement);
}
$checkAuthGroupId = $placement['GROUP_ID'] ?? "";
?>
<?php
include_once(__DIR__.'/include/header.php');
if(!$checkAuth){
    include_once(__DIR__.'/include/no_auth.php');
}else{
    include_once(__DIR__.'/include/grid_params.php');
    /* @var \Bitrix\Main\Result $loadParamsEntity */
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

        /* @var string $cacheId */
        /* @var int $cacheKey */
        // $loadParamsEntity - могут добавиться ошибки
        include_once(__DIR__.'/include/gen_keys.php');

        if($loadParamsEntity->isSuccess()){

            $app->setCacheParams($cacheId);
            $bxRowsResFields = $app->postMethod('crm.item.fields', array(
                'entityTypeId'=>$arParams['SMART_ID'],
            ));
            if($bxRowsResFields->isSuccess()) {
                $bxFields = $bxRowsResFields->getData();
                $allFields = $bxFields['result']['result']['fields'];
                //echo'<pre>';print_r($allFields);echo'</pre>';
                $cacheKey++;
                $app->setCacheParams($cacheId.'_'.$cacheKey);
                $categoryRes = $app->postMethod('crm.category.list', array(
                    "entityTypeId"=>$arParams['SMART_ID'],
                ));
                $stagesIds = [];
                if($categoryRes->isSuccess()) {
                    $scategoryData = $categoryRes->getData();
                    foreach($scategoryData['result']['result']['categories'] as $status){
                        $stagesIds['DYNAMIC_'.$status['entityTypeId'].'_STAGE_'.$status['id']] = $status['name'];
                    }
                }
                //echo'<pre>';print_r($scategoryData);echo'</pre>';
                $batchAr = [];
                foreach($stagesIds as $stageKey=>$stageName){
                    $key = mb_strtolower($stageKey);
                    $batchAr[$key] = [
                        'method'=>'crm.status.list',
                        'params'=> [
                            'order'=>["SORT"=>"ASC"],
                            'filter'=>["ENTITY_ID"=>$stageKey],
                        ]
                    ];
                }
                //unset($batchAr['dynamic_131_stage_10']);
                //echo'<pre>';print_r($batchAr);echo'</pre>';
                include_once(__DIR__.'/include/batch_fields_params.php');
                //echo'<pre>';print_r($allFields);echo'</pre>';
                //echo'<pre>';print_r($stagesIds);echo'</pre>';
                //echo'<pre>';print_r($batchResData);echo'</pre>';
                foreach($allFields as &$field){
                    if($field['type'] == 'crm_status' &&
                        in_array($field['upperName'], ['PREVIOUS_STAGE_ID','STAGE_ID'])
                    ){
                        $values = [''=>'Не указано'];
                        foreach($stagesIds as $stageKey=>$categoryName){
                            $batchKey = mb_strtolower($stageKey);
                            if(isset($batchResData[$batchKey]) && is_array($batchResData[$batchKey])){
                                foreach($batchResData[$batchKey] as $stageData){
                                    $values[$stageData['STATUS_ID']] = $categoryName.': '.$stageData['NAME'];
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
                    }

                    $field = \Awz\Admin\Helper::preformatField($field);
                }
                unset($field);


                $arParams['SMART_FIELDS'] = $allFields;
                if(isset($arParams['SMART_FIELDS']['contacts'])){
                    $arParams['SMART_FIELDS']['contacts']['isReadOnly'] = 1;
                }


                include(__DIR__.'/include/clever_smart.php');
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
            if(\Awz\Admin\Helper::checkDissabledFilter($arParams, $obField)) continue;
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
        unset($field);
        foreach($addFilters as $f){
            $arParams['FIND'][] = $f;
        }

        include(__DIR__.'/include/standart_actions.php');
    }
    include(__DIR__.'/include/entity_error.php');
}
include(__DIR__.'/include/footer.php');