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
use Awz\BxApi\Helper;
include_once(__DIR__.'/include/load_modules.php');
$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('SmartList', 'OnEndBufferContent'), false, 999);

class SmartList extends IList implements IParams {
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
            \Awz\Admin\SmartTable::$fields = $params['SMART_FIELDS'];
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
            "ENTITY" => "\\Awz\\Admin\\SmartTable",
            "BUTTON_CONTEXTS"=>[
                [
                    'add'=> [
                        'TEXT' => 'Добавить элемент',
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
            $method = 'crm.item.fields';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields = $app->postMethod($method, array('entityTypeId'=>$arParams['SMART_ID']));

            $app->setCacheParams($cacheId.'_bp');
            $method = 'bizproc.workflow.template.list';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxBp = $app->postMethod($method, [
                'filter'=>['MODULE_ID'=>'crm', 'ENTITY'=>'%Dynamic', 'DOCUMENT_TYPE'=>'DYNAMIC_'.$arParams['SMART_ID']],
                'select'=>['ID','NAME','PARAMETERS','ENTITY','SYSTEM_CODE','DOCUMENT_TYPE']
            ]);
            if($bxBp->isSuccess()){
                $arParams['BP_ACTION'] = [];
                foreach($bxBp->getData()['result']['result'] as $tpl){
                    $arParams['BP_ACTION'][] = [
                        'ID'=>$tpl['ID'].',crm,Bitrix\Crm\Integration\BizProc\Document\Dynamic,DYNAMIC_'.$arParams['SMART_ID'].'_#ID#',
                        'NAME'=>$tpl['NAME']
                    ];
                }
            }

            if($bxRowsResFields->isSuccess()){
                $bxFields = $bxRowsResFields->getData();
                $allFields = $bxFields['result']['result']['fields'];
                //echo'<pre>';print_r($allFields);echo'</pre>';
                $cacheKey++;
                $app->setCacheParams($cacheId.'_'.$cacheKey);
                $method = 'crm.category.list';
                if(!empty($arParams['EXT_PARAMS'])){
                    $method = $arParams['EXT_PARAMS'][1].$method;
                }
                $categoryRes = $app->postMethod($method, array(
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
                //echo'<pre>';print_r($allFields);echo'</pre>';

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
        //echo'<pre>';print_r($bxRowsResFields);echo'</pre>';
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
        $fileName = 'domains/'.$app->getRequest()->get('DOMAIN').'/change_filter.php';
        if(file_exists($fileName)){
            include_once($fileName);
        }
        include(__DIR__.'/include/standart_actions.php');
    }
    include(__DIR__.'/include/entity_error.php');
}
include(__DIR__.'/include/footer.php');