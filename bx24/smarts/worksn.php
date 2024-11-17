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
use Bitrix\Main\Localization\Loc;
use Awz\BxApi\App;
use Bitrix\Main\Web\Json;
include_once(__DIR__.'/include/load_modules.php');
$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('WorksList', 'OnEndBufferContent'), false, 999);

class WorksList extends IList implements IParams {
    public static $TABLEID;
    public static $smartId;

    public static function getTitle(): string
    {
        return Loc::getMessage('AWZ_BXAPI_CURRENCY_CODES_LIST_TITLE');
    }

    public static function OnEndBufferContent(&$content){
        if(!self::$TABLEID) return;
        $content = str_replace('parent.BX.ajax.','window.awz_ajax_proxy.', $content);
        if(\Bitrix\Main\Loader::includeModule('awz.bxapistats')){
            $tracker = \Awz\BxApiStats\Tracker::getInstance();
            $trackData = \Awz\BxApiStats\Helper::getHtmlStats($tracker, self::$TABLEID);
            $addHtml = $trackData[0];
            $searchNode = '<div class="main-grid-nav-panel">';
            if(mb_strpos($content, $searchNode)!==false){
                $content .= $trackData[1].$addHtml;
            }elseif(mb_strpos($content, '</body>')!==false){
                $content = str_replace('</body>',$addHtml.'</body>', $content);
            }else{
                $content .= $addHtml;
            }
        }
    }

    public function __construct($params, $publicMode=false){

        if(!empty($params['SMART_FIELDS'])){
            \Awz\Admin\WorksTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        self::$TABLEID = $params['TABLEID'];
        $params = \Awz\Admin\Helper::addCustomPanelButton($params);
        parent::__construct($params, $publicMode);
    }

    public function trigerGetRowListAdmin(&$row){
        /* @var $row CAdminUiListRow */

        \Awz\Admin\Helper::defTrigerList($row, $this);

        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;

        $codesEntity = \Awz\BxApi\Helper::entityCodes();
        $codesLink = [];
        foreach($codesEntity as $ent){
            $codesLink[(string)$ent['ID']] = $ent['CODE'];
        }
        $allSmarts = $this->getParam('ALL_SMARTS',[]);
        foreach($allSmarts as $v){
            $codesLink[(string)$v['entityTypeId']] = mb_strtoupper($v['id']);
        }

        $code = 'OWNER_TYPE_ID';
        if($row->arRes[$code] && isset($codesLink[(string)$row->arRes[$code]])){
            $fieldHtml = '<div data-type="'.$codesLink[(string)$row->arRes[$code]].'" data-id="'.$row->arRes['OWNER_ID'].'" class="awz-autoload-field awz-autoload-'.$codesLink[(string)$row->arRes[$code]].'-'.$row->arRes['OWNER_ID'].'">'.$row->arRes['OWNER_ID'].'</div>';
            $row->AddViewField('OWNER_ID', $fieldHtml);
        }

        //\Awz\Admin\Helper::defTrigerList($row, $this);

    }

    public function trigerInitFilter(){
    }

    public function trigerGetRowListActions(array $actions): array
    {
        return $actions;
    }

    public static function getParams(): array
    {
        $arParams = [
            "PRIMARY"=>"ID",
            "ENTITY" => "\\Awz\\Admin\\WorksTable",
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
            "ADD_LIST_ACTIONS"=> [
                "delete",
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
        //$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
        //echo'<pre>';print_r($_REQUEST);echo'</pre>';
        //echo'<pre>';print_r($_POST);echo'</pre>';
        static $results;
        if(!$results){
            $request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
            if($bx_result = $request->getPost('bx_result')){
                $results = $bx_result;
                //$this->addUsersFromAdminResult($results['users'] ?? []);
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
            $gridOptions = new GridOptions($this->getParam('TABLEID'));
            $sort = $gridOptions->getSorting(['sort'=>[$this->getParam('PRIMARY') =>'desc']]);
            $_EXT_PARAMS = $this->getParam('EXT_PARAMS');
            ?>
            <script type="text/javascript">
                $(document).ready(function(){
                    BX24.ready(function() {
                        BX24.init(function () {
                            window.AwzBx24EntityLoader_ents = {};
                            <?foreach($this->getParam('JS_ENTITIES', []) as $code=>$ent){
                            ?>
                            try{window.AwzBx24EntityLoader_ents['<?=$code?>'] = <?=$ent?>;}catch(e){}
                            <?
                            }?>
                            <?if($prefilter = $this->getParam('GRID_OPTIONS_PREFILTER')){?>
                            window.awz_helper.addFilter = <?=\CUtil::PhpToJSObject($prefilter)?>;
                            <?}?>
                            window.awz_helper.gridUrl = window.location.pathname + window.location.search;
                            <?if(defined('CURRENT_CODE_PAGE')){?>
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/index.php?','/smarts/?');
                            window.awz_helper.gridUrl = window.awz_helper.gridUrl.replace('/smarts/?','/smarts/<?=CURRENT_CODE_PAGE?>.php?');
                            <?}?>
                            <?if(isset($_EXT_PARAMS[1])){?>window.awz_helper.extUrl = '<?=$_EXT_PARAMS[1]?>';<?}?>
                            window.awz_helper.currentUserId = '<?=$this->getParam('CURRENT_USER')?>';
                            window.awz_helper.lastOrder = <?=\CUtil::PhpToJSObject($sort['sort'])?>;
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
                            <?if(!empty($this->getParam('ALL_SMARTS'))){?>
                            <?foreach($this->getParam('ALL_SMARTS') as $smart){?>
                            window.awz_nhelper.entityIdsLinkCodes['<?=$smart['entityTypeId']?>'] = '<?=$smart['code']?>_';
                            window.awz_nhelper.entityIdsLinkId['<?=$smart['code']?>_'] = '<?=$smart['entityTypeId']?>';
                            <?}?>
                            <?}?>
                        });
                    });
                });
            </script>
            <?php
        }

    }
}

use WorksList as PageList;

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
    include_once(__DIR__.'/include/def_load_params.php');
    /* @var \Bitrix\Main\Result $loadParamsEntity */
    if($arParams['SMART_ID'] && $loadParamsEntity->isSuccess()){
        /* @var string $cacheId */
        /* @var int $cacheKey */
        // $loadParamsEntity - могут добавиться ошибки
        include_once(__DIR__.'/include/gen_keys.php');
        include_once(__DIR__.'/include/awz_placements.php');

        if($loadParamsEntity->isSuccess()){

            $app->setCacheParams($cacheId);
            $method = 'crm.activity.fields';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields = $app->postMethod($method);

            if($bxRowsResFields->isSuccess()){
                $bxFields = $bxRowsResFields->getData();
                $allFields = $bxFields['result']['result'];
                //echo'<pre>';print_r($allFields);echo'</pre>';
                $batchAr = [];
                include_once(__DIR__.'/include/batch_fields_params.php');
                /* @var array $batchResData */
                //echo'<pre>';print_r($batchResData);echo'</pre>';

                $allSmarts = [];
                $smartsRes = $app->postMethod('crm.type.list');
                $keyBatch = 'workslist_crm_type_list';
                if(isset($batchResData[$keyBatch]['types']) &&
                    !empty($batchResData[$keyBatch]['types'])
                ){
                    foreach($batchResData[$keyBatch]['types'] as $smartItem){
                        $allSmarts[] = [
                            'entityTypeId'=>$smartItem['entityTypeId'],
                            'id'=>'dynamic_'.$smartItem['entityTypeId'],
                            'code'=>'T'.dechex($smartItem['entityTypeId'])
                        ];
                    }
                }
                $arParams['ALL_SMARTS'] = $allSmarts;
                //echo'<pre>';print_r($allFields);echo'</pre>';

                $deActiveFields = [





                ];
                $activeFields = [
                        'ID',
                        'OWNER_ID',
                        'OWNER_TYPE_ID',
                        'TYPE_ID',
                        'PROVIDER_ID',
                        'PROVIDER_TYPE_ID',
                        'PROVIDER_GROUP_ID',
                        'ASSOCIATED_ENTITY_ID',
                        'SUBJECT',
                        'START_TIME',
                        'END_TIME',
                        'DEADLINE',
                        'COMPLETED',
                        'STATUS',
                        'RESPONSIBLE_ID',
                        'PRIORITY',
                        //'NOTIFY_TYPE',
                        //'NOTIFY_VALUE',
                        //'DESCRIPTION',
                        //'DESCRIPTION_TYPE',
                        'DIRECTION',
                        //'LOCATION',
                        'CREATED',
                        'AUTHOR_ID',
                        'LAST_UPDATED',
                        'EDITOR_ID',
                        //'SETTINGS',
                        'ORIGIN_ID',
                        'ORIGINATOR_ID',
                        //'RESULT_STATUS',
                        //'RESULT_STREAM',
                        //'RESULT_SOURCE_ID',
                        //'PROVIDER_PARAMS',
                        //'PROVIDER_DATA',
                        //'RESULT_MARK',
                        //'RESULT_VALUE',
                        //'RESULT_SUM',
                        //'RESULT_CURRENCY_ID',
                        //'AUTOCOMPLETE_RULE',
                        'BINDINGS',
                        //'COMMUNICATIONS',
                        'FILES',
                        'WEBDAV_ELEMENTS',
                        'IS_INCOMING_CHANNEL'
                ];
                $finFields = [];
                foreach($allFields as $key=>&$field){
                    if($field['type'] == 'char') $field['type'] = 'string';
                    if($key == 'BINDINGS'){
                        $field['type'] = 'crm';
                        $field['isReadOnly'] = '0';
                        $field['settings'] = [
                            'deal'=>'Y',
                            'lead'=>'Y',
                            'company'=>'Y',
                            'contact'=>'Y'
                        ];
                        foreach($allSmarts as $row){
                            $field['settings'][$row['id']] = 'Y';
                        }
                    }
                    if($key == 'COMMUNICATIONS'){
                        $field['type'] = 'string';
                    }
                    if($key == 'OWNER_ID'){
                        $field['type'] = 'string';
                    }
                    if($key == 'COMPLETED'){
                        $field['type'] = 'enum';
                        $field['values'] = ['Y'=>'да','N'=>'нет'];
                    }
                    if($key == 'IS_INCOMING_CHANNEL'){
                        $field['type'] = 'enum';
                        $field['values'] = ['Y'=>'да','N'=>'нет'];
                    }
                    if($key == 'ID'){
                        $field['noLink'] = true;
                    }
                    $field['sort'] = $key;

                    $field = \Awz\Admin\Helper::preformatField($field);
                    if(!in_array($key, $deActiveFields)){
                        $finFields[$key] = $field;
                        $selectFormatFields[] = $key;
                    }

                }
                $allFields = $finFields;
                unset($field);
                //echo'<pre>';print_r($allFields);echo'</pre>';

                $arParams['SMART_FIELDS'] = $allFields;


                include(__DIR__.'/include/clever_smart.php');

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

        $fields = \Awz\Admin\WorksTable::getMap();
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
            if($field['id'] == 'STATUS'){
                $field['params']['multiple'] = 'Y';
            }
            if($field['id'] == 'OWNER_TYPE_ID'){
                $field['params']['multiple'] = 'Y';
            }
            if($field['id'] == 'TYPE_ID'){
                $field['params']['multiple'] = 'Y';
            }
            if($field['id'] == 'PRIORITY'){
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