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
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('TaskList', 'OnEndBufferContent'), false, 999);

class TaskList extends IList implements IParams {
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
            \Awz\Admin\TaskTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        self::$TABLEID = $params['TABLEID'];
        $params = \Awz\Admin\Helper::addCustomPanelButton($params);
        parent::__construct($params, $publicMode);
    }

    public function trigerGetRowListAdmin($row){
        //print_r($row);
        //die();
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
        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
        if(isset($res['tasks'])){
            foreach ($res['tasks'] as $row){
                if(empty($row)) continue;
                //$row['id'] = 'n: '.$n.', ost: '.$ost.', pageSize: '.$pageSize;
                foreach($row as $k=>$v){
                    if(isset($fields[$k]) && in_array($fields[$k]['type'], ['date','datetime'])){
                        if(is_array($v)){
                            foreach($v as &$v2){
                                if($v2)
                                    $v2 = \Bitrix\Main\Type\DateTime::createFromTimestamp(strtotime($v2))->toString();
                            }
                            $row[$k] = $v;
                            unset($v2);
                        }else{
                            if($v)
                                $row[$k] = \Bitrix\Main\Type\DateTime::createFromTimestamp(strtotime($v))->toString();
                        }
                    }
                }

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
            $sort = $gridOptions->getSorting(['sort'=>['ID'=>'desc']]);
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
                        });
                    });
                });
            </script>
            <?php
        }

    }
}

use TaskList as PageList;

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

    $arParams['GROUP_ID'] = '';
    $prefilter = $arParams['GRID_OPTIONS_PREFILTER'];
    if(!empty($prefilter) && isset($prefilter['GROUP_ID']) && $prefilter['GROUP_ID']){
        $arParams['GROUP_ID'] = $prefilter['GROUP_ID'];
    }

    /* @var \Bitrix\Main\Result $loadParamsEntity */
    if($arParams['SMART_ID'] && $loadParamsEntity->isSuccess()){
        /* @var string $cacheId */
        /* @var int $cacheKey */
        // $loadParamsEntity - могут добавиться ошибки
        include_once(__DIR__.'/include/gen_keys.php');
        include_once(__DIR__.'/include/awz_placements.php');

        if($loadParamsEntity->isSuccess()){

            $app->setCacheParams($cacheId);
            $method = 'tasks.task.getFields';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields = $app->postMethod($method);

            $cacheKey++;
            $app->setCacheParams($cacheId.'_'.$cacheKey);
            $method = 'tasks.task.getFields';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields2 = $app->postMethod($method);

            if($bxRowsResFields->isSuccess()){
                $bxFields = $bxRowsResFields->getData();
                $bxFields2 = $bxRowsResFields2->getData();
                $allFields = $bxFields['result']['result']['fields'];
                if(isset($bxFields2['result']['result'])){
                    foreach($bxFields2['result']['result'] as $field){
                        if(isset($allFields[$field['FIELD_NAME']])){
                            //echo'<pre>';print_r($field);echo'</pre>';
                            $allFields[$field['FIELD_NAME']]['type'] = $field['USER_TYPE_ID'];
                            foreach($field as $keyName=>$keyVal){
                                if(!isset($allFields[$field['FIELD_NAME']][$keyName])){
                                    $allFields[$field['FIELD_NAME']][$keyName] = $keyVal;
                                }
                            }
                        }
                    }
                }
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
                    //'PARENT_ID',
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

                $cacheKey++;
                $app->setCacheParams($cacheId.'_'.$cacheKey);
                $method = 'task.stages.get';
                if(!empty($arParams['EXT_PARAMS'])){
                    $method = $arParams['EXT_PARAMS'][1].$method;
                }
                $bxRowsResStages = $app->postMethod($method, ['entityId'=>(int)$arParams['GROUP_ID']]);

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
                    $app->cleanCache($cacheId.'_'.$cacheKey);
                }


                $newFormatFields = [];
                $selectFormatFields = [];
                foreach($allFields as $key=>$val){
                    if(in_array($key, $disabledFields)) continue;
                    if(isset($val['SETTINGS']) && is_array($val['SETTINGS'])){
                        $val['settings'] = $val['SETTINGS'];
                    }
                    if(in_array($key, $readOnlyFields)){
                        $val['isReadOnly'] = 1;
                    }
                    if(in_array($key, $sortableField)){
                        $val['sort'] = $key;
                    }else{
                        $val['sort'] = false;
                    }
                    $val = \Awz\Admin\Helper::preformatField($val);
                    if($key=='STATUS'){
                        $val['sort'] = 'REAL_STATUS';
                    }
                    $val['upperCase'] = $key;
                    if($key == 'UF_CRM_TASK')
                        $val['isMultiple'] = 1;
                    if($val['MULTIPLE'] == 'Y'){
                        $val['isMultiple'] = 1;
                    }
                    $key = lcfirst(\Bitrix\Main\Text\StringHelper::snake2camel($key));
                    $newFormatFields[$key] = $val;
                    $selectFormatFields[] = $val['upperCase'];
                }
                unset($allFields);

                $allFields = $newFormatFields;
                $batchAr = [];
                include_once(__DIR__.'/include/batch_fields_params.php');
                foreach($allFields as &$field){

                }
                unset($field);

                //echo'<pre>';print_r($batchResData);echo'</pre>';
                //die();

                $deActiveFields = [





                ];
                $activeFields = [];
                $finFields = [];
                foreach($allFields as $key=>&$field){
                    //$field['sort'] = $key;
                    if($arParams['GROUP_ID'] && ($key == 'groupId')){
                        $field['noFilter'] = 1;
                    }

                    $field = \Awz\Admin\Helper::preformatField($field);
                    if(!in_array($key, $deActiveFields)){
                        $finFields[$key] = $field;
                        $selectFormatFields[] = $key;
                    }

                }
                $finFields = $allFields;
                unset($field);
                //echo'<pre>';print_r($allFields);echo'</pre>';

                $arParams['SMART_FIELDS'] = $finFields;
                $arParams['SMART_FIELDS_SELECT'] = $selectFormatFields;

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

        $fields = \Awz\Admin\TaskTable::getMap();
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