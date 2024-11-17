<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
use Awz\BxApi\Dict\Parameters;
use Bitrix\Main\Application;

/**
 *
 */
class AwzSmartEntityParam extends Parameters {

    /**
     * @var array
     */
    protected $params = array();

    /**
     * @param array $params
     */
    public function __construct(array $params = array())
    {
        parent::__construct($params);
    }

    /**
     * @param $params
     * @param string $code
     * @return AwzSmartEntityParam
     */
    public function applyParam(&$params, string $code){
        $params[$code] = $this->getParam($code);
        return $this;
    }

    /**
     * @param $params
     * @param $codes
     * @return AwzSmartEntityParam
     */
    public function applyParams(&$params, $codes = []){
        foreach($codes as $code){
            $this->applyParam($params, $code);
        }
        return $this;
    }

    /**
     * @param string $code
     * @return AwzSmartEntityParam
     */
    public function setExtUrl(string $code=''){
        if($extWebHook = Application::getInstance()->getContext()->getRequest()->get('ext')){
            $url = 'https://'.$extWebHook;
            $this->setParam('EXT_PARAMS', [
                $code,
                'https://'.$extWebHook
            ]);
            $externalDomain = preg_replace('/([^\/]+\/\/[^\/]+)\/.*/is',"$1", $url);
            $this->setParam('externalDomain',$externalDomain);
        }
        return $this;
    }
}

/**
 *
 */
final class AwzSmartEntities {
    /**
     * @var null
     */
    protected static $instance = null;

    /* @var $gridOptions array[AwzSmartEntityParam] */
    private static $gridOptions = [];
    private static $hookEntities = [];

    /**
     *
     */
    protected function __construct(){

    }

    /**
     * @return AwzSmartEntities
     */
    public static function getInstance()
    {
        if (!static::$instance)
        {
            static::$instance = new static();
        }
        return static::$instance;
    }

    /**
     * @param string $code
     * @param array $params
     * @return $this
     */
    public function setEntity(string $code, array $params = []){
        self::$gridOptions[$code] = new AwzSmartEntityParam(['code'=>$code]);
        return $this;
    }

    /**
     * @param string $code
     * @param array $params
     * @return $this
     */
    public function updateEntity(string $code, array $params = []){
        $ent = $this->getEntity($code);
        foreach($params as $key=>$value){
            $ent->setParam($key, $value);
        }
        return $this;
    }

    /**
     * @param string $code
     * @return AwzSmartEntityParam
     */
    public function getEntity(string $code): AwzSmartEntityParam
    {
        if(!isset(self::$gridOptions[$code])) {
            self::$gridOptions[$code] = new AwzSmartEntityParam(['code'=>$code]);
        };
        return self::$gridOptions[$code];
    }

    /**
     * @param $code
     * @return AwzSmartEntityParam|void
     */
    public function setEntityFromCode($code, $id=''){
        if($code === 'EXT_DYNAMIC') return $this->setEntitySmart($code, (int) $id)->setExtUrl('dynamic');
        if($code === 'EXT_RPA') return $this->setEntityRpa($code, (int) $id)->setExtUrl('rpa');
        if($code === 'EXT_LISTS_LISTS') return $this->setEntityListsLists($code, (int) $id)->setExtUrl('lists_lists');
        if($code === 'EXT_LEAD') return $this->setEntityLead($code)->setExtUrl('lead');
        if($code === 'EXT_COMPANY') return $this->setEntityCompany($code)->setExtUrl('company');
        if($code === 'EXT_CONTACT') return $this->setEntityContact($code)->setExtUrl('contact');
        if($code === 'EXT_DEAL') return $this->setEntityDeal($code)->setExtUrl('deal');
        if($code === 'EXT_DOCS') return $this->setEntityDocs($code)->setExtUrl('docs');
        if($code === 'EXT_WORKS') return $this->setEntityWorks($code)->setExtUrl('works');
        if($code === 'EXT_TASK_USER') return $this->setEntityTasks($code)->setExtUrl('tasks');
        if($code === 'DYNAMIC') return $this->setEntitySmart($code, (int) $id);
        if($code === 'RPA') return $this->setEntityRpa($code, (int) $id);
        if($code === 'LISTS_LISTS') return $this->setEntityListsLists($code, (int) $id);
        if($code === 'LEAD') return $this->setEntityLead();
        if($code === 'COMPANY') return $this->setEntityCompany();
        if($code === 'CONTACT') return $this->setEntityContact();
        if($code === 'DEAL') return $this->setEntityDeal();
        if($code === 'DOCS') return $this->setEntityDocs();
        if($code === 'WORKS') return $this->setEntityWorks();
        if($code === 'TASK_USER') return $this->setEntityTasks();
        return null;
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntitySmart(string $code = 'DYNAMIC', int $smartId){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code.'_'.$smartId)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.item.list')
            ->setParam('method_list_params', [
                'entityTypeId'=>$smartId,
                'filter'=>['id'=>'#IDS#'],
                'start'=>-1,
                'select'=>['id','title','createdTime','opportunity','currencyId']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', 'items')
            ->setParam('method_search', 'crm.item.list')
            ->setParam('search_key', '%title')
            ->setParam('method_search_params', [
                'entityTypeId'=>$smartId,
                'filter'=>['%title'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['id','title','createdTime','opportunity','currencyId'],
                'order'=>['id'=>'desc']
            ])
            ->setParam('method_delete', 'crm.item.delete')
            ->setParam('method_update', 'crm.item.update')
            ->setParam('method_add', 'crm.item.add')
            ->setParam('min_code', 'T'.dechex($smartId))
            ->setParam('add_short', '1')
            ->setParam('link', '/crm/type/'.$smartId.'/details/#ID#/')
            ->setParam('result_key', 'items');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityListsLists(string $code = 'LISTS_LISTS', int $entityId){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code.'_'.$entityId)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'lists.element.get')
            ->setParam('method_list_params', [
                'IBLOCK_TYPE_ID'=>'lists',
                'IBLOCK_ID'=>$entityId,
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','NAME']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'lists.element.get')
            ->setParam('search_key', '%NAME')
            ->setParam('method_search_params', [
                'IBLOCK_TYPE_ID'=>'lists',
                'IBLOCK_ID'=>$entityId,
                'filter'=>['%NAME'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','NAME']
            ])
            ->setParam('method_delete', 'lists.element.delete')
            ->setParam('method_update', 'lists.element.update')
            ->setParam('method_add', 'lists.element.add')
            ->setParam('min_code', 'IB'.$entityId)
            ->setParam('add_short', '1')
            ->setParam('link', '/company/lists/'.$entityId.'/element/0/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityRpa(string $code = 'RPA_', int $entityId){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code.'_'.$entityId)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'rpa.item.list')
            ->setParam('method_list_params', [
                'typeId'=>$entityId,
                'filter'=>['id'=>'#IDS#'],
                'start'=>-1,
                'select'=>['id','name','createdTime']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', 'items')
            ->setParam('method_search', 'rpa.item.list')
            ->setParam('search_key', '%'.'UF_RPA_'.$entityId.'_NAME')
            ->setParam('method_search_params', [
                'typeId'=>$entityId,
                'filter'=>['%'.'UF_RPA_'.$entityId.'_NAME'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['id','name','createdTime']
            ])
            ->setParam('method_delete', 'rpa.item.delete')
            ->setParam('method_update', 'rpa.item.update')
            ->setParam('method_add', 'rpa.item.add')
            ->setParam('min_code', 'RPA'.$entityId)
            ->setParam('add_short', '1')
            ->setParam('link', '/rpa/item/'.$entityId.'/#ID#/')
            ->setParam('result_key', 'items');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityAwzOrm(string $code = 'EXT_AWZORM', string $appMethod){
        $external = 1;
        return $this->getEntity($code.'_'.$appMethod)
            ->setParam('isExternal', $external)
            ->setParam('method_list', $appMethod.'.list')
            ->setParam('method_list_params', [
                'filter'=>['id'=>'#IDS#'],
                'start'=>-1,
                'select'=>['id','title']
            ])
            //->setParam('enable_dialog', 1)
            //->setParam('enable_autoload_list', 1)
            ->setParam('list_key', 'items')
            ->setParam('method_search', 'crm.item.list')
            ->setParam('search_key', '%title')
            ->setParam('method_search_params', [
                'filter'=>['%title'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['id','title']
            ])
            ->setParam('method_delete', $appMethod.'.delete')
            ->setParam('method_update', $appMethod.'.update')
            ->setParam('method_add', $appMethod.'.add')
            ->setParam('method_fields', $appMethod.'.fields')
            ->setParam('min_code', '')
            ->setParam('add_short', '1')
            //->setParam('link', '/crm/type/'.$smartId.'/details/#ID#/')
            ->setParam('result_key', 'items');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityLead(string $code = 'LEAD'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.lead.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'crm.lead.list')
            ->setParam('search_key', '%TITLE')
            ->setParam('method_search_params', [
                'filter'=>['%TITLE'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('method_delete', 'crm.lead.delete')
            ->setParam('method_update', 'crm.lead.update')
            ->setParam('method_add', 'crm.lead.add')
            ->setParam('min_code', 'L')
            ->setParam('add_short', '1')
            ->setParam('link', '/crm/lead/details/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityTasks(string $code = 'TASK_USER'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'tasks.task.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', 'tasks')
            ->setParam('method_search', 'tasks.task.list')
            ->setParam('search_key', 'TITLE')
            ->setParam('method_search_params', [
                'filter'=>['TITLE'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('method_delete', 'tasks.task.delete')
            ->setParam('method_update', 'tasks.task.update')
            ->setParam('method_add', 'tasks.task.add')
            ->setParam('min_code', 'TASK')
            ->setParam('add_short', '1')
            ->setParam('link', '/company/personal/user/0/tasks/task/view/#ID#/')
            ->setParam('result_key', 'tasks');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityDocs(string $code = 'DOCS'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.documentgenerator.document.list')
            ->setParam('method_list_params', [
                'filter'=>['id'=>'#IDS#'],
                'start'=>-1,
                'select'=>['id','title','createTime']
            ])
            //->setParam('enable_dialog', 1)
            //->setParam('enable_autoload_list', 1)
            ->setParam('list_key', 'documents')
            ->setParam('method_search', 'crm.documentgenerator.document.list')
            ->setParam('search_key', '%title')
            ->setParam('method_search_params', [
                'filter'=>['%title'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['id','title','createTime']
            ])
            ->setParam('method_delete', 'crm.documentgenerator.document.delete')
            ->setParam('method_update', 'crm.documentgenerator.document.update')
            //->setParam('method_add', '')
            ->setParam('min_code', '')
            ->setParam('add_short', '1')
            //->setParam('link', '/crm/lead/details/#ID#/')
            ->setParam('result_key', 'documents');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityWorks(string $code = 'WORKS'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.activity.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','SUBJECT','CREATED']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'crm.activity.list')
            ->setParam('search_key', '%SUBJECT')
            ->setParam('method_search_params', [
                'filter'=>['%SUBJECT'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','SUBJECT','CREATED']
            ])
            ->setParam('method_delete', 'crm.activity.delete')
            ->setParam('method_update', 'crm.activity.update')
            ->setParam('method_add', 'crm.activity.add')
            ->setParam('min_code', 'WORK')
            ->setParam('add_short', '1')
            //->setParam('link', '/crm/lead/details/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityDeal(string $code = 'DEAL'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.deal.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE','OPPORTUNITY','CURRENCY_ID']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'crm.deal.list')
            ->setParam('search_key', '%TITLE')
            ->setParam('method_search_params', [
                'filter'=>['%TITLE'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE','OPPORTUNITY','CURRENCY_ID']
            ])
            ->setParam('method_delete', 'crm.deal.delete')
            ->setParam('method_update', 'crm.deal.update')
            ->setParam('method_add', 'crm.deal.add')
            ->setParam('min_code', 'D')
            ->setParam('add_short', '1')
            ->setParam('link', '/crm/deal/details/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityCompany(string $code = 'COMPANY'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.company.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'crm.company.list')
            ->setParam('search_key', '%TITLE')
            ->setParam('method_search_params', [
                'filter'=>['%TITLE'=>'#QUERY#'],
                'start'=>-1,
                'select'=>['ID','TITLE','DATE_CREATE']
            ])
            ->setParam('method_delete', 'crm.company.delete')
            ->setParam('method_update', 'crm.company.update')
            ->setParam('method_add', 'crm.company.add')
            ->setParam('min_code', 'CO')
            ->setParam('add_short', '1')
            ->setParam('link', '/crm/company/details/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @return AwzSmartEntityParam
     */
    private function setEntityContact(string $code = 'CONTACT'){
        $external = mb_substr($code, 0, 4) == 'EXT_' ? 1 : 0;
        return $this->getEntity($code)
            ->setParam('isExternal', $external)
            ->setParam('method_list', 'crm.contact.list')
            ->setParam('method_list_params', [
                'filter'=>['ID'=>'#IDS#'],
                'start'=>-1,
                'select'=>['ID','NAME','LAST_NAME','DATE_CREATE']
            ])
            ->setParam('enable_dialog', 1)
            ->setParam('enable_autoload_list', 1)
            ->setParam('list_key', '')
            ->setParam('method_search', 'crm.contact.list')
            ->setParam('search_key', '%NAME')
            ->setParam('method_search_params', [
                [
                    'filter'=>['%NAME'=>'#QUERY#'],
                    'start'=>-1,
                    'select'=>['ID','NAME','LAST_NAME','DATE_CREATE']
                ],
                [
                    'filter'=>['%LAST_NAME'=>'#QUERY#'],
                    'start'=>-1,
                    'select'=>['ID','NAME','LAST_NAME','DATE_CREATE']
                ]
            ])
            ->setParam('method_delete', 'crm.contact.delete')
            ->setParam('method_update', 'crm.contact.update')
            ->setParam('method_add', 'crm.contact.add')
            ->setParam('min_code', 'C')
            ->setParam('add_short', '1')
            ->setParam('link', '/crm/contact/details/#ID#/')
            ->setParam('result_key', '-');
    }

    /**
     * @param string $code
     * @return string
     */
    public function getCodeFromSmartId(string $code){
        if(mb_strpos($code, '_e_')!==false){
            $tmp = explode('_e_', $code);
            $code = $tmp[0];
        }
        if(mb_strpos($code, 'EXT_RPA_')!==false) return 'EXT_RPA';
        if(mb_strpos($code, 'EXT_AWZORM_')!==false) return 'EXT_AWZORM';
        if(mb_strpos($code, 'EXT_DYNAMIC_')!==false) return 'EXT_DYNAMIC';
        if(mb_strpos($code, 'EXT_LISTS_LISTS_')!==false) return 'EXT_LISTS_LISTS';
        if(mb_strpos($code, 'DYNAMIC_')!==false) return 'DYNAMIC';
        if(mb_strpos($code, 'RPA_')!==false) return 'RPA';
        if(mb_strpos($code, 'LISTS_LISTS_')!==false) return 'LISTS_LISTS';
        return $code;
    }

    public function addUserHookEntity($data, $userData){
        //echo'<pre>';print_r($data);echo'</pre>';
        //echo'<pre>';print_r($userData);echo'</pre>';
        if(!isset($data['PARAMS']['handler']['from'])) return null;
        //$entCode = $this->getCodeFromSmartId($data['PARAMS']['handler']['from']);
        $entId = 'HOOK_'.$data['ID'];
        $entId2 = 'HOOK'.$data['ID'];
        $smartCode = $this->getCodeFromSmartId($data['PARAMS']['handler']['from']);
        if($smartCode != $data['PARAMS']['handler']['from']){
            $defEntity = $this->setEntityFromCode($smartCode, str_replace($smartCode.'_','',$data['PARAMS']['handler']['from']));
        }else{
            $defEntity = $this->setEntityFromCode($smartCode);
        }
        if(!$defEntity) return null;
        if(!$defEntity->getParam('enable_dialog') && !$defEntity->getParam('enable_autoload_list')) return null;
        $currentEntity = $this->getEntity($entId);
        $jsOptions = [
            'caption'=>'',
            'short'=>$defEntity->getParam('min_code'),
            'add_short'=>$defEntity->getParam('add_short'),
            'tab'=>$userData['NAME'],
            'alias'=>[$entId2,mb_strtolower($entId),mb_strtolower($entId2)],
            'parent_alias'=>$defEntity->getParam('code'),
            'parent_alias_code'=>$defEntity->getParam('min_code'),
            'm_list'=>$defEntity->getParam('method_list'),
            'list_key'=>$defEntity->getParam('list_key'),
            'm_search'=>$defEntity->getParam('method_search'),
            'search_key'=>$defEntity->getParam('search_key'),
            'm_list_params'=>$defEntity->getParam('method_list_params', []),
            'm_search_params'=>$defEntity->getParam('method_search_params', []),
        ];
        if($defEntity->getParam('isExternal')){
            $jsOptions['parent_alias'] = '';
            $jsOptions['parent_alias_code'] = '';
            $jsOptions['short'] = $entId2;
            $urlAr = explode('&ext=', $data['URL']);
            $urlArDomain = explode('/',$urlAr[1]);
            $jsOptions['url'] = 'https://'.$urlAr[1];
            $jsOptions['batch_dissable'] = 1;
            $jsOptions['link'] = $urlArDomain[0].$defEntity->getParam('link');
            $jsOptions['link'] = 'https://'.str_replace('//','/',$jsOptions['link']);
        }
        $currentEntity->setParam('jsOptions',$jsOptions);

        $jsOptions['m_list_params'] = \CUtil::phpToJsObject($jsOptions['m_list_params']);
        $jsOptions['m_search_params'] = \CUtil::phpToJsObject($jsOptions['m_search_params']);
        $options = CUtil::phpToJsObject($jsOptions);
        $options = str_replace('\\\\\\','\\',$options);
        //$options = str_replace(['\'#','#\''],'#', $options);
        $currentEntity->setParam('entity_options', $options);
        self::$hookEntities[] = $entId;
        /*
         this['entKeys']['awz_placementlist'] = {
            'batch_dissable':'Y',
            'caption': 'встройка','short':'',
            'tab':'Встройки',
            'alias':['AWZ_PLACEMENTLIST'],
            'm_list':'dialoglist',
            'm_search':'dialoglist',
            'm_list_params':'{\'domain\':\'#domain#\',\'app\':\'#app#\',\'signed\':\'#signed#\',\'filter_ID\':#IDS#}',
            'm_search_params':'{\'domain\':\'#domain#\',\'app\':\'#app#\',\'signed\':\'#signed#\',\'filter_QUERY\':"#QUERY#"}',
        };
         * */
    }

    public function getHookEntities(){
        $entities = [];
        foreach(self::$hookEntities as $ent){
            $entities[] = $this->getEntity($ent);
        }
        return $entities;
    }

    public static function getPortalParametersClean(\Awz\BxApi\App $app){
        $batchEntitiesCacheKey = md5(serialize([$app->getRequest()->get('DOMAIN'),$app->getConfig('APP_ID'), 'EntitiesCache']));
        $batchEntitiesCacheKey2 = md5(serialize([$app->getRequest()->get('DOMAIN'),$app->getConfig('APP_ID'), 'EntitiesCache2']));
        $app->cleanCache($batchEntitiesCacheKey.'_0');
        $app->cleanCache($batchEntitiesCacheKey);
        $app->cleanCache($batchEntitiesCacheKey2.'_0');
        $app->cleanCache($batchEntitiesCacheKey2);
        for($i=1;$i<20;$i++){
            $app->cleanCache($batchEntitiesCacheKey2.'_'.$i);
        }
    }

    public static function getPortalParameters(\Awz\BxApi\App $app, $clearCache=false): \Bitrix\Main\Result
    {
        $result = new \Bitrix\Main\Result();
        if($clearCache){
            self::getPortalParametersClean($app);
        }
        $batchEntitiesCacheKey = md5(serialize([$app->getRequest()->get('DOMAIN'),$app->getConfig('APP_ID'), 'EntitiesCache']));
        $batchEntitiesCacheKey2 = md5(serialize([$app->getRequest()->get('DOMAIN'),$app->getConfig('APP_ID'), 'EntitiesCache2']));
        if($clearCache){
            $app->cleanCache($batchEntitiesCacheKey.'_0');
            $app->cleanCache($batchEntitiesCacheKey2.'_0');
            for($i=1;$i<10;$i++){
                $app->cleanCache($batchEntitiesCacheKey2.'_'.$i);
            }
        }
        $batchEntities = [
            'smarts'=> ['method'=>'crm.type.list', 'params'=> ['order'=>['id'=>'desc']]],
            'rpa'=> ['method'=>'rpa.type.list', 'params'=> ['order'=>['id'=>'desc']]],
            'listslists'=> ['method'=>'lists.get', 'params'=> ['IBLOCK_TYPE_ID'=>'lists', 'IBLOCK_ORDER'=>['ID'=>'DESC']]],
            'bitrixprocesses'=> ['method'=>'lists.get', 'params'=> ['IBLOCK_TYPE_ID'=>'bitrix_processes', 'IBLOCK_ORDER'=>['ID'=>'DESC']]],
            'catalog'=> ['method'=>'catalog.catalog.list', 'params'=> ['order'=>['id'=>'DESC']]],
            'groups'=> ['method'=>'sonet_group.get', 'params'=> ['IS_ADMIN'=>'Y', 'FILTER'=>['ACTIVE'=>'Y']]],
            'groups_2'=> ['method'=>'sonet_group.get', 'params'=> ['IS_ADMIN'=>'Y', 'FILTER'=>['ACTIVE'=>'Y'], 'ORDER'=>["ID"=>"DESC"], 'start'=>50]],
            'groups_3'=> ['method'=>'sonet_group.get', 'params'=> ['IS_ADMIN'=>'Y', 'FILTER'=>['ACTIVE'=>'Y'], 'ORDER'=>["ID"=>"DESC"], 'start'=>100]],
            'groups_4'=> ['method'=>'sonet_group.get', 'params'=> ['IS_ADMIN'=>'Y', 'FILTER'=>['ACTIVE'=>'Y'], 'ORDER'=>["ID"=>"DESC"], 'start'=>150]],
        ];

        $batchEntitiesRes = $app->callBatch($batchEntities, [], '', $batchEntitiesCacheKey);
        if($batchEntitiesRes->isSuccess()){
            $batchEntitiesData = $batchEntitiesRes->getData();

            $batchEntities2 = [];
            unset($v);
            foreach($batchEntitiesData['result_total'] as $k=>$v){
                if(mb_strpos($k, 'groups')!==false) continue;
                $pages = ceil($v/50);
                for($i=0; $i<$pages; $i++){
                    $start = $i*50;
                    if($start > 0){
                        $prep = $batchEntities[$k];
                        $prep['params']['start'] = $start;
                        $batchEntities2[$k.'_'.$i] = $prep;
                    }
                }
            }
            $finalBatchData = [];
            $groupCount = $batchEntitiesData['result_total']['groups'];
            foreach($batchEntitiesData['result'] as $key=>$row){
                if(in_array($key,['smarts', 'rpa'])){
                    $finalBatchData[$key] = [];
                    foreach($row['types'] as $itm){
                        $finalBatchData[$key][] = $itm;
                    }
                }else if(in_array($key,['listslists','groups','bitrixprocesses','catalog'])){
                    $finalBatchData[$key] = [];
                    foreach($row as $itm){
                        $finalBatchData[$key][] = $itm;
                    }
                }else if(
                    (($groupCount > 150) && ($key == 'groups_4')) ||
                    (($groupCount > 100) && ($key == 'groups_3')) ||
                    (($groupCount > 50) && ($key == 'groups_2'))
                ){
                    foreach($row as $itm){
                        $finalBatchData['groups'][] = $itm;
                    }
                }
            }
            foreach($finalBatchData['groups'] as $group){
                $batchEntities2['listssocnet_'.$group['ID']] = ['method'=>'lists.get', 'params'=> ['IBLOCK_TYPE_ID'=>'lists_socnet', 'SOCNET_GROUP_ID'=>$group['ID'], 'IBLOCK_ORDER'=>['ID'=>'DESC']]];
            }
            $finalBatchData['cleverSmart'] = null;
            $finalBatchData['cleverfields'] = null;
            if(!empty($finalBatchData['smarts'])){
                foreach($finalBatchData['smarts'] as $smart){
                    if($smart['title'] === 'Умный смарт'){
                        $finalBatchData['cleverSmart'] = $smart;
                        $batchEntities2['cleverfields'] = ['method'=>'crm.item.fields', 'params'=> ['entityTypeId'=>$smart['entityTypeId']]];
                        break;
                    }
                }
            }
            if(!empty($batchEntities2)){
                $batchEntitiesRes = $app->callBatch($batchEntities2, [], '', $batchEntitiesCacheKey2);
                if($batchEntitiesRes->isSuccess()){
                    $batchEntitiesData = $batchEntitiesRes->getData();
                    foreach($batchEntitiesData['result'] as $keyf=>$row){
                        $prepareKey = explode('_',$keyf);
                        $key = $prepareKey[0];
                        if($key === 'cleverfields'){
                            $finalBatchData[$key] = $row['fields'];
                        }elseif(in_array($key,['rpa','smarts'])){
                            $finalBatchData[$key] = [];
                            foreach($row['types'] as $itm){
                                $finalBatchData[$key][] = $itm;
                            }
                        }else if(in_array($key,['listslists','listssocnet','bitrixprocesses','catalog'])){
                            $finalBatchData[$key] = [];
                            foreach($row as $itm){
                                $finalBatchData[$key][] = $itm;
                            }
                        }else{
                            $finalBatchData[$keyf] = $row;
                        }
                    }
                }else{
                    $result->addErrors($batchEntitiesRes->getErrors());
                }
            }
            unset($batchEntitiesData);
            unset($batchEntitiesRes);
            //$finalBatchData

        }else{
            $result->addErrors($batchEntitiesRes->getErrors());
        }

        $result->setData(['result'=>$finalBatchData]);
        return $result;
    }

}