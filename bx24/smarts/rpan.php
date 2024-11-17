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
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('RpaList', 'OnEndBufferContent'), false, 999);

class RpaList extends IList implements IParams {
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
            \Awz\Admin\RpaTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        self::$TABLEID = $params['TABLEID'];
        $params = \Awz\Admin\Helper::addCustomPanelButton($params);
        parent::__construct($params, $publicMode);
    }

    public function trigerGetRowListAdmin($row){
        \Awz\Admin\Helper::defTrigerList($row, $this);
        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
        $primaryCode = $this->getParam('PRIMARY', 'ID');
        \Awz\Admin\Helper::defTrigerList($row, $this);

        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
        $primaryCode = $this->getParam('PRIMARY', 'ID');
        foreach($fields as $fieldCode=>$fieldData){
            $addHtml = '';
            if($fieldCode === 'id'){
                $codeEnt = $this->getParam('SMART_ID');
                $row->AddViewField($fieldCode, $addHtml.'<a class="open-smart" data-ent="RPA_'.$codeEnt.'" data-id="'.$row->arRes[$this->getParam('PRIMARY')].'" href="#">'.$row->arRes[$fieldCode].'</a>');
            }
            if(in_array($fieldCode, ['name','id'])){
                $codeEnt = $this->getParam('SMART_ID');
                $row->AddViewField($fieldCode, $addHtml.'<a class="open-smart" data-ent="RPA_'.$codeEnt.'" data-id="'.$row->arRes[$this->getParam('PRIMARY')].'" href="#">'.$row->arRes[$fieldCode].'</a>');
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
            "ENTITY" => "\\Awz\\Admin\\RpaTable",
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

use RpaList as PageList;

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
            $method = 'userfieldconfig.list';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields = $app->postMethod($method, array(
                'moduleId'=>'rpa',
                "select"=>["0"=> "*", "language"=> "ru"],
                'filter'=>['entityId'=>'RPA_'.$arParams['SMART_ID']]
            ));
            $cacheKey++;
            $app->setCacheParams($cacheId.'_'.$cacheKey);
            $method = 'rpa.stage.listForType';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResStages = $app->postMethod($method, array(
                'typeId'=>$arParams['SMART_ID']
            ));
            //echo'<pre>';print_r($bxRowsResStages);echo'</pre>';
            //echo'<pre>';print_r($bxRowsResFields);echo'</pre>';
            if($bxRowsResFields->isSuccess() && $bxRowsResStages->isSuccess()) {
                $bxFields = $bxRowsResFields->getData();
                $bxStages = $bxRowsResStages->getData();

                $cacheKey++;
                $app->setCacheParams($cacheId.'_'.$cacheKey);
                //echo'<pre>';print_r($bxFields['result']['total']);echo'</pre>';
                $batchAr = [];
                if(isset($bxFields['result']['total']) && ($bxFields['result']['total']>50)){
                    $lastStart = 0;
                    $bxFields['result']['total'] = $bxFields['result']['total'] - 50;
                    while($bxFields['result']['total'] > 0){
                        $lastStart = $lastStart + 50;
                        $batchAr['rpa_fields_'.count($batchAr)] = [
                            'method'=>'userfieldconfig.list',
                            'params'=> [
                                'moduleId'=>'rpa',
                                "select"=>["0"=> "*", "language"=> "ru"],
                                'filter'=>['entityId'=>'RPA_'.$arParams['SMART_ID']],
                                'start'=>$lastStart
                            ]
                        ];
                        $bxFields['result']['total'] = $bxFields['result']['total'] - 50;
                    }
                }
                if(isset($bxStages['result']['total']) && ($bxStages['result']['total']>50)){
                    $lastStart = 0;
                    $bxStages['result']['total'] = $bxStages['result']['total'] - 50;
                    while($bxStages['result']['total'] > 0){
                        $lastStart = $lastStart + 50;
                        $batchAr['rpa_stages_'.count($batchAr)] = [
                            'method'=>'rpa.stage.listForType',
                            'params'=> [
                                'typeId'=>$arParams['SMART_ID'],
                                'start'=>$lastStart
                            ]
                        ];
                        $bxStages['result']['total'] = $bxStages['result']['total'] - 50;
                    }
                }
                if(!empty($batchAr)){
                    $cacheNums = ceil(count($batchAr)/50);
                    $cacheIds = [];
                    while($cacheNums > 0){
                        $cacheNums = $cacheNums-1;
                        $cacheKey++;
                        $cacheIds[] = $cacheId.'_'.$cacheKey;
                    }
                    $external = '';
                    if(!empty($arParams['EXT_PARAMS'])){
                        $external = $arParams['EXT_PARAMS'][1];
                    }
                    $batchRes = $app->callBatch($batchAr, $cacheIds, $external);
                    if($batchRes->isSuccess()){
                        $batchResDataPrepare = $batchRes->getData();
                        $batchResDataPrepare = $batchResDataPrepare['result'];
                    }
                }
                foreach($batchResDataPrepare as $key=>$values){
                    if(strpos($key,'rpa_stages_')!==false){
                        foreach($values as $v){
                            $bxStages['result']['result']['stages'][] = $v;
                        }
                    }else if(strpos($key,'rpa_fields_')!==false){
                        foreach($values as $v){
                            $bxFields['result']['result']['fields'][] = $v;
                        }
                    }
                }
                $batchAr = [];
                $allFields = $bxFields['result']['result']['fields'];
                $allStages = $bxStages['result']['result']['stages'];
                $stages = [];
                foreach($allStages as $stage){
                    $stages[$stage['id']] = $stage['name'];
                }
                //echo'<pre>';print_r($allFields);echo'</pre>';
                //echo'<pre>';print_r($allStages);echo'</pre>';
                $allNewFields = [];
                $allNewFields['id'] = [
                    'type'=>'integer',
                    'isRequired'=>1,
                    'isReadOnly'=>1,
                    'isMultiple'=>0,
                    'title'=>'ID'
                ];
                $allNewFields['stageId'] = [
                    'type'=>'crm_status',
                    'statusType'=>'RPA_'.$arParams['SMART_ID'],
                    'isRequired'=>1,
                    'isReadOnly'=>1,
                    'isMultiple'=>0,
                    'title'=>'Стадия',
                    'values'=>$stages
                ];
                $allNewFields['previousStageId'] = [
                    'type'=>'crm_status',
                    'statusType'=>'RPA_'.$arParams['SMART_ID'],
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Предыдущая стадия',
                    'values'=>$stages
                ];
                /*$allNewFields['typeId'] = [
                    'type'=>'integer',
                    'isRequired'=>0,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Идентификатор предыдущей стадии элемента'
                ];*/
                $allNewFields['xmlId'] = [
                    'type'=>'string',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Строка для внешнего идентификатора'
                ];
                $allNewFields['name'] = [
                    'type'=>'string',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'название элемента'
                ];
                $allNewFields['detailUrl'] = [
                    'type'=>'url',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'ссылка на карточку элемента',
                    //'settings'=>[
                    //    'domain'=>$externalDomain ? str_replace('https://','',$externalDomain) : $checkAuthDomain
                    //]
                ];
                $allNewFields['createdBy'] = [
                    'type'=>'user',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Сотрудник создавший элемент'
                ];
                $allNewFields['updatedBy'] = [
                    'type'=>'user',
                    'isRequired'=>0,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Сотрудник изменивший элемент'
                ];
                $allNewFields['movedBy'] = [
                    'type'=>'user',
                    'isRequired'=>0,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Сотрудник сменивший стадию'
                ];
                $allNewFields['createdTime'] = [
                    'type'=>'datetime',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Время создания'
                ];
                $allNewFields['updatedTime'] = [
                    'type'=>'datetime',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Время обновления'
                ];
                $allNewFields['movedTime'] = [
                    'type'=>'datetime',
                    'isRequired'=>1,
                    'isMultiple'=>0,
                    'isReadOnly'=>1,
                    'title'=>'Время смены стадии'
                ];
                foreach($allFields as $field){
                    $field['title'] = $field['listColumnLabel']['ru'];
                    if(!$field['title']) $field['title'] = $field['editFormLabel']['ru'];
                    if(!$field['title']) $field['title'] = $field['fieldName']['ru'];
                    $field['isMultiple'] = $field['multiple'] == 'Y' ? 1 : 0;
                    //$field['isReadOnly'] = $field['mandatory'] == 'Y' ? 0 : 1;
                    $field['isRequired'] = $field['mandatory'] == 'Y' ? 1 : 0;
                    //$field['noFilter'] = $field['isSearchable'] == 'N' ? 1 : 0;
                    if(is_string($field['userTypeId'])){
                        $field['type'] = $field['userTypeId'];
                    }else{
                        continue;
                    }
                    $field['filterKey'] = $field['fieldName'];
                    $allNewFields[$field['fieldName']] = $field;
                }
                $allFields = $allNewFields;
                //unset($batchAr['dynamic_131_stage_10']);
                //echo'<pre>';print_r($batchAr);echo'</pre>';
                include_once(__DIR__.'/include/batch_fields_params.php');
                //echo'<pre>';print_r($allFields);echo'</pre>';
                //echo'<pre>';print_r($stagesIds);echo'</pre>';
                //echo'<pre>';print_r($batchResData);echo'</pre>';
                foreach($allFields as &$field){
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
                if(!empty($bxRowsResFields->getErrors()))
                    $loadParamsEntity->addErrors($bxRowsResFields->getErrors());
                if(!empty($bxRowsResStages->getErrors()))
                    $loadParamsEntity->addErrors($bxRowsResStages->getErrors());
            }
        }
        //echo'<pre>';print_r($bxRowsResFields);echo'</pre>';
    }
    if($arParams['SMART_ID'] && !$customPrint && $loadParamsEntity->isSuccess()){
        PageList::$smartId = $arParams['SMART_ID'];
        $adminCustom = new PageList($arParams, true);

        $fields = \Awz\Admin\RpaTable::getMap();
        $addFilters = [];

        $addFilters[] = [
            'id'=>'tasks',
            'realId'=>'tasks',
            'name'=>'Есть задания',
            'type'=>'list',
            'items'=>[
                ''=>'-',
                'has_tasks'=>'да',
                'no_tasks'=>'нет'
            ],
            'filterable'=>''
        ];

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