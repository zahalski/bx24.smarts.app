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
use Bitrix\Main\Data\Cache;
use Awz\BxApi\Helper;
include_once(__DIR__.'/include/load_modules.php');
$eventManager = \Bitrix\Main\EventManager::getInstance();
$eventManager->addEventHandlerCompatible('main', 'OnEndBufferContent', array('DocsList', 'OnEndBufferContent'), false, 999);

class DocsList extends IList implements IParams {
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
            \Awz\Admin\DocsTable::$fields = $params['SMART_FIELDS'];
        }
        $params['TABLEID'] = $params['GRID_ID'];
        self::$TABLEID = $params['TABLEID'];
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
            "ENTITY" => "\\Awz\\Admin\\DocsTable",
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
        $entity = $this->getParam('ENTITY');
        $fields = $entity::$fields;
        $codes = $fields['entityTypeId']['entity_codes'];
        $codesLink = [];
        foreach($codes as $v){
            $codesLink[$v['ID']] = $v['MIN_CODE'];
        }
        if(isset($res['documents'])){
            foreach ($res['documents'] as $row){
                if(empty($row)) continue;
                if($row['entityTypeId'] && $row['entityId']){
                    $row['additional_crm'] = $codesLink[$row['entityTypeId']].'_'.$row['entityId'];
                }
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

use DocsList as PageList;

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
            $method = 'crm.type.list';
            if(!empty($arParams['EXT_PARAMS'])){
                $method = $arParams['EXT_PARAMS'][1].$method;
            }
            $bxRowsResFields = $app->postMethod($method, ['filter'=>['isDocumentsEnabled'=>'Y']]);

            $allFields = [
                'id'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид',
                    'noLink'=>1,
                    'sort'=>'id'
                ],
                'title'=>[
                    'type'=>'string',
                    'isReadOnly'=>1,
                    'title'=>'Название',
                    'noLink'=>1,
                    'sort'=>'title'
                ],
                'number'=>[
                    'type'=>'string',
                    'isReadOnly'=>1,
                    'title'=>'Номер',
                    'sort'=>'number'
                ],
                'templateId'=>[
                    'type'=>'enum',
                    'isReadOnly'=>1,
                    'title'=>'Ид шаблона',
                    'sort'=>'templateId'
                ],
                'fileId'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид файла',
                ],
                'imageId'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид изображения',
                ],
                'pdfId'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид pdf',
                ],
                'createTime'=>[
                    'type'=>'datetime',
                    'isReadOnly'=>1,
                    'title'=>'Дата создания',
                    'sort'=>'createTime'
                ],
                'updateTime'=>[
                    'type'=>'datetime',
                    'isReadOnly'=>1,
                    'title'=>'Дата обновления',
                    'sort'=>'updateTime'
                ],
                'createdBy'=>[
                    'type'=>'user',
                    'isReadOnly'=>1,
                    'title'=>'Кем создан',
                    'sort'=>'createdBy'
                ],
                'updatedBy'=>[
                    'type'=>'user',
                    'isReadOnly'=>1,
                    'title'=>'Кем обновлен',
                    'sort'=>'updatedBy'
                ],
                'downloadUrl'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на doc',
                    'fixValue'=>'.doc [скачать]'
                ],
                'pdfUrl'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на pdf',
                    'fixValue'=>'.pdf [скачать]'
                ],
                'imageUrl'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на img',
                    'fixValue'=>'.jpg [скачать]'
                ],
                'stampsEnabled'=>[
                    'type'=>'bool',
                    'isReadOnly'=>1,
                    'title'=>'Штамп активен',
                    'sort'=>'stampsEnabled'
                ],
                'entityId'=>[
                    'type'=>'integer',
                    'isReadOnly'=>1,
                    'title'=>'Ид элемента',
                ],
                'entityTypeId'=>[
                    'type'=>'enum',
                    'values'=>[],
                    'isReadOnly'=>1,
                    'title'=>'Тип CRM сущности',
                ],
                'additional_crm'=>[
                    'type'=>'crm',
                    'isReadOnly'=>1,
                    'title'=>'Элемент CRM',
                    'settings'=>[],
                    'noFilter'=>1
                ],
                'downloadUrlMachine'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на скачивание DOC',
                    'fixValue'=>'.DOC [скачать]'
                ],
                'pdfUrlMachine'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на скачивание PDF',
                    'fixValue'=>'.PDF [скачать]'
                ],
                'imageUrlMachine'=>[
                    'type'=>'url',
                    'isReadOnly'=>1,
                    'title'=>'Ссылка на скачивание IMG',
                    'fixValue'=>'.JPG [скачать]'
                ],
                'values'=>[
                    'type'=>'doc_values',
                    'isReadOnly'=>1,
                    'title'=>'Значения полей',
                    'noFilter'=>1
                ]
            ];

            $entCodes = Helper::entityCodes();

            if($bxRowsResFields->isSuccess()){
                $bxRowsResFieldsData = $bxRowsResFields->getData();
                //echo'<pre>';print_r($bxRowsResFieldsData);echo'</pre>';
                foreach($bxRowsResFieldsData['result']['result']['types'] as $smartData){

                    $entCodes[] = [
                        'ID'=>$smartData['entityTypeId'],
                        'VALUE'=>$smartData['title'],
                        'CODE'=>'DYNAMIC_'.$smartData['entityTypeId'],
                        'MIN_CODE'=>'T'.dechex(intval($smartData['entityTypeId']))
                    ];
                }
                $allFields['entityTypeId']['entity_codes'] = $entCodes;
                foreach($entCodes as $k=>$v){
                    $allFields['entityTypeId']['values'][$v['ID']] = $v['VALUE'];
                }

                //echo'<pre>';print_r($allFields);echo'</pre>';
                $batchAr = [];
                include_once(__DIR__.'/include/batch_fields_params.php');
                foreach($allFields as &$field){

                }
                unset($field);

                //echo'<pre>';print_r($allFields);echo'</pre>';
                //die();

                $deActiveFields = [





                ];
                $activeFields = [];
                $finFields = [];
                foreach($allFields as $key=>&$field){
                    //$field['sort'] = $key;

                    $field = \Awz\Admin\Helper::preformatField($field);
                    if(!in_array($key, $deActiveFields)){
                        $finFields[$key] = $field;
                        $selectFormatFields[] = $key;
                    }

                }
                $allFields = $finFields;
                unset($field);
                //echo'<pre>';print_r($allFields);echo'</pre>';

                $arParams['SMART_FIELDS'] = $finFields;
                $arParams['SMART_FIELDS_SELECT'] = ['*'];

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

        $fields = \Awz\Admin\DocsTable::getMap();
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

        }
        unset($field);
        foreach($addFilters as $f){
            $arParams['FIND'][] = $f;
        }

        include(__DIR__.'/include/noteditable_actions.php');
    }
    include(__DIR__.'/include/entity_error.php');
}
include(__DIR__.'/include/footer.php');