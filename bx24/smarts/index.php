<?
define("NOT_CHECK_PERMISSIONS", true);
define("STOP_STATISTICS", true);
define("BX_SENDPULL_COUNTER_QUEUE_DISABLE", true);
define('BX_SECURITY_SESSION_VIRTUAL', true);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
header("Access-Control-Allow-Origin: *");

use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension as UIExt;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\Security;
use Awz\BxApi\App;
use Awz\BxApi\Helper;

use Bitrix\Iblock\PropertyEnumerationTable;
use Bitrix\Main\Grid\Options as GridOptions;
use Bitrix\Main\UI\PageNavigation;
use Awz\BxApi\Api\Filters\Request\SetFilter;

if(!Loader::includeModule('awz.bxapi')){
    return;
}

global $APPLICATION;
$appId = 'app.63d6b637131902.97765356';
$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
if($request->get('app')){
    $appId = $request->get('app');
}

$app = new App(array(
    'APP_ID'=>$appId,
    'APP_SECRET_CODE'=>Helper::getSecret($appId),
    //'LOG_FILENAME'=>'bx_log_save_txt_n_test2.txt',
    //'LOG_DIR'=>__DIR__
));

try{
    //MENUID
    $pStart = [];
    if($request->get('MENUID')){
        $pStart = [
            'HOOK' => intval($request->get('MENUID'))
        ];
    }else if($request->get('PLACEMENT') == 'REST_APP_URI'){
        $pStart = Json::decode($request->get('PLACEMENT_OPTIONS'));
    }

    //echo'<pre>';print_r($request->getPostList());echo'</pre>';
    //die();

    if(isset($pStart['HOOK'])){
        $handlerData = \Awz\BxApi\HandlersTable::getList([
            'select'=>['*'],
            'filter'=>[
                '=ID'=>$pStart['HOOK'],
                '=PORTAL'=>$request->get('DOMAIN')
            ]
        ])->fetch();
        if($handlerData &&
            isset($handlerData['PARAMS']['handler']['app']) &&
            $handlerData['PARAMS']['handler']['app'] &&
            $handlerData['PARAMS']['handler']['app'] === $request->get('app')
        ){

            $tkn = array();
            $tkn['access_token'] = htmlspecialchars($app->getRequest()->get('AUTH_ID'));
            $tkn['client_endpoint'] = 'https://' .htmlspecialchars($app->getRequest()->get('DOMAIN')). '/rest/';
            $app->setAuth($tkn);

            /*$batch = [
                'app.option.get'=>'app.option.get',
                'profile'=>'profile',
            ];
            $batchResult = $app->getMethod('batch', ['cmd'=>$batch]);
            if($batchResult->isSuccess()){
                $batchResultData = $batchResult->getData();
                if(is_array($batchResultData['result']['result']['result']['app.option.get'])){
                    $key = md5(serialize(['app.option.get', $app->getAuth()]));
                    $batchCachedResults[$key] = new \Bitrix\Main\Result();
                    $batchCachedResults[$key]->setData(
                         ['result'=>['result'=>$batchResultData['result']['result']['result']['app.option.get']]]
                    );
                }
                if(is_array($batchResultData['result']['result']['result']['profile'])){
                    $key = md5(serialize(['profile', $app->getAuth()]));
                    $batchCachedResults[$key] = new \Bitrix\Main\Result();
                    $batchCachedResults[$key]->setData(
                         ['result'=>['result'=>$batchResultData['result']['result']['result']['profile']]]
                    );
                }
            }
            echo'<pre>';print_r($batchResultData);echo'</pre>';
            die();
            */

            //$resOption = $app->getMethod('app.option.get');
            $app->prepareBatchCached([
                'app.option.get'=>'app.option.get',
                'profile'=>'profile',
            ]);
            $resOption = $app->getBatchCached('app.option.get');
            $portalData = $app->getCurrentPortalData($request->get('DOMAIN'), 'Y');
            if(!empty($portalData) && isset($portalData['PARAMS']['key']) &&
                $portalData['PARAMS']['key'] && $resOption->isSuccess())
            {
                $resOptionData = $resOption->getData();
                $check = false;
                if($resOptionData['result']['result']['auth'] === $portalData['PARAMS']['key']){
                    if(!isset($handlerData['PARAMS']['hook']['users'])){
                        $check = true;
                    }elseif(empty($handlerData['PARAMS']['hook']['users'])){
                        $check = true;
                    }elseif(!empty($handlerData['PARAMS']['hook']['users'])){
                        $resUser = $app->getBatchCached('profile');
                        if($resUser->isSuccess()){
                            $resUserData = $resUser->getData();
                            if(
                                isset($resUserData['result']['result']['ID']) &&
                                in_array($resUserData['result']['result']['ID'], $handlerData['PARAMS']['hook']['users'])
                            ){
                                $check = true;
                            }else{
                                $check = true;
                                //echo 'Встройка не доступна для Вас, администратор ограничил ее видимость.';
                            }
                        }
                    }
                }

                $page = preg_replace('/.*\/([a-z]+)\.php.*/is',"$1",$handlerData['URL']);
                $page = preg_replace('/([^a-z])/is','',$page);



                if($check){
                    if($page === 'indexn'){
                        define('CURRENT_PARENT_PLACEMENT', $handlerData['ID']);
                        $handledAr = explode('grid=',$handlerData['URL']);
                        if(count($handledAr) == 2){
                            $request->addFilter(new SetFilter('grid_id', $handledAr[1], 'get'));
                        }
                    }else{
                        $filePath = __DIR__.'/'.$page.'.php';
                        if(file_exists($filePath)){
                            $server = \Bitrix\Main\Application::getInstance()->getContext()->getServer();
                            $newReqUrl = str_replace('/smarts/index.php?','/smarts/'.$page.'.php?',$server->getRequestUri());
                            $newReqUrl = str_replace('/smarts/?','/smarts/'.$page.'.php?',$newReqUrl);
                            $server->rewriteUri($newReqUrl, $_SERVER['QUERY_STRING']);
                            global $APPLICATION;
                            $APPLICATION->setCurPage($newReqUrl);
                            $request->addFilter(new SetFilter('ID', $handlerData['ID'], 'get'));
                            $request->addFilter(new SetFilter('TOKEN', $handlerData['HASH'], 'get'));
                            $request->addFilter(new SetFilter('DOMAIN', $handlerData['PORTAL'], 'get'));
                            //echo'<pre>';print_r($request->getValues());echo'</pre>';
                            define('CURRENT_CODE_PAGE', $page);
                            require($filePath);
                            die();
                        }
                    }
                }

                //echo'<pre>';print_r($request->get);echo'</pre>';
                //echo'<pre>';print_r($portalData);echo'</pre>';
                //echo'<pre>';print_r($handlerData);echo'</pre>';
                //echo'<pre>';print_r($resUserData['result']['result']['ID']);echo'</pre>';
            }

        }
    }

}catch (\Exception $e){

}

$tracker = null;
if(Loader::includeModule('awz.bxapistats')){
    $tracker = \Awz\BxApiStats\Tracker::getInstance();
    $tracker->addCount();
}

if(!defined('CURRENT_PARENT_PLACEMENT')){
    $request->addFilter(new SetFilter('grid_id', 'awz_s__1_APP_LINK__2_APP_LINK__h_main', 'get'));
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <?
    Asset::getInstance()->addCss("/bitrix/css/main/bootstrap.css");
    Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
    Asset::getInstance()->addCss("/bx24/smarts/style.css");
    Asset::getInstance()->addCss("/bitrix/components/awz/public.ui.grid/templates/.default/style.css");
    ?>
    <?$APPLICATION->ShowHead()?>
    <script src="//api.bitrix24.com/api/v1/"></script>
</head>
<?
$fraimeType = '';
$placement = $app->getRequest()->get('PLACEMENT_OPTIONS');
if($placement){
    $placement = Json::decode($placement);
    if($placement['IFRAME_TYPE']){
        $fraimeType = 'slide_'.strtolower($placement['IFRAME_TYPE']);
    }
}
if(!$fraimeType && $app->getRequest()->get('IFRAME_TYPE')){
    $fraimeType = 'slide_'.strtolower($app->getRequest()->get('IFRAME_TYPE'));
}
if(!$fraimeType && $app->getRequest()->get('PLACEMENT')==='REST_APP_URI'){
    $fraimeType = 'slide_'.strtolower($app->getRequest()->get('PLACEMENT'));
}
if(!$fraimeType && $app->getRequest()->get('PLACEMENT')==='LEFT_MENU'){
    $fraimeType = 'slide_rest_app_uri';
}
//echo'<pre>';print_r($request->getQueryList());echo'</pre>';
//echo'<pre>';print_r($request->getPostList());echo'</pre>';
?>
<body class="<?=$fraimeType?>"><div class="workarea">
<div class="container"><div class="row"><div class="result-block-messages"></div></div></div>


<div class="appWrapPlaceList" data-page="place-list">
    <div class="container"><div class="row"><div class="ui-block-wrapper">
                <div class="ui-block-title">
                    <div class="ui-block-title-text">Доступные Вам встройки</div>
                    <div class="ui-block-title-actions">
                        <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
                    </div>
                </div>
                <div class="ui-block-content active">
                    <div class="container">
                        <div class="row row-items-active">

                        </div>
                    </div>
                    <div class="container">
                        <div id="stat-app-moved"></div>
                    </div>
                </div>
            </div></div></div>
</div>
<div class="appWrap" data-page="main">
<?if($app->getRequest()->get('install') == 'Y')
{
    $app->log($_REQUEST);
    CJsCore::init('jquery');
    UIExt::load("ui.alerts");

    if($_REQUEST['secret']){

        $res = \Awz\BxApi\AppsTable::getList(array(
            'select'=>array('*'),
            'filter'=>array('=PORTAL'=>htmlspecialcharsEx(trim($_REQUEST['DOMAIN'])), '=APP_ID'=>$appId)
        ))->fetch();
        if(!$res){
            $resAdd = \Awz\BxApi\AppsTable::add(array(
                'NAME'=>'Баг Смарты '.htmlspecialcharsEx(trim($_REQUEST['DOMAIN'])),
                'PORTAL'=>htmlspecialcharsEx(trim($_REQUEST['DOMAIN'])),
                'APP_ID'=>$appId,
                'TOKEN'=>htmlspecialcharsEx(trim($_REQUEST['secret'])),
                'ACTIVE'=>'Y'
            ));
        }
    }

    ?>
    <script>
        BX24.ready(function() {
            BX24.init(function () {
                BX24.callMethod('app.info', {}, function(res){
                    BX24.installFinish();
                });
            });
        });
    </script>
<?
}
elseif($app->getRequest()->get('server_domain') == 'oauth.bitrix.info')
{
    UIExt::load("ui.buttons");
    UIExt::load("ui.buttons.icons");
    UIExt::load("ui.alerts");
    $result = $app->getStartToken();

    if($result->isSuccess()){
    $resultData = $result->getData();
    $app->setAuth($resultData['result']);
    $appInfoResult = $app->getAppInfo();
    if($appInfoResult->isSuccess()){
        $appInfo = $appInfoResult->getData();
        if(isset($appInfo['result']['LICENSE'])/* &&
        strpos($appInfo['result']['LICENSE'], 'by_')!==false*/)
        {
            $authData = $app->getAuth();
            $authKey = \Bitrix\Main\Security\Random::getString(32);
            if($app->getRequest()->get('app_key')){
                $authKey = $app->getRequest()->get('app_key');
            }

            $resKeyAdd = $app->postMethod('app.option.set.json',
                                          array(
                                              'options'=>array(
                                                  'auth'=>$authKey
                                              )
                                          )
            );
            if($resKeyAdd->isSuccess()){
                $portal = str_replace(array('/rest/','https://'),'',$authData['client_endpoint']);
                \Awz\BxApi\TokensTable::updateToken(
                    $app->getConfig('APP_ID'), $portal,
                    $authData
                );
                \Awz\BxApi\TokensTable::updateParams(
                    $app->getConfig('APP_ID'), $portal,
                    array('key'=>$authKey)
                );
                ?>
                    <div class="center-error-wrap">
                        <h2>Авторизация принята, токен успешно записан.</h2>
                        <div class="tab-content tab-content-list">
                            <div class="ui-alert ui-alert-success">
                                Перейдите на портал и обновите страницу для настройки приложения.
                            </div>
                        </div>
                    </div>
                <?
            }else{
                echo Helper::errorsHtml($resKeyAdd, 'Ошибка записи ключа доступа');
            }
            }else{
                echo Helper::errorsHtmlFromText(array('Приложение доступно только для Беларуси','Лицензия '.$appInfo['result']['LICENSE']));
            }
        }else{
            echo Helper::errorsHtml($result, 'Произошла ошибка при проверке токена');
        }
    //echo'<pre>';print_r($appInfoResult);echo'</pre>';
    }else{
        echo Helper::errorsHtml($result, 'Произошла ошибка при авторизации');
    }
}
else
{
    $signedParameters = '';
    CJsCore::init('jquery');
    CJSCore::init("sidepanel");
    UIExt::load("ui.buttons");
    UIExt::load("ui.buttons.icons");
    UIExt::load("ui.forms");
    UIExt::load("ui.alerts");
    UIExt::load("ui.fonts.opensans");
    UIExt::load("ui.hint");
    UIExt::load("ui.icons.b24");
    UIExt::load("ui.icons.service");
    UIExt::load("ui.layout-form");
    UIExt::load('ui.entity-selector');
    Asset::getInstance()->addJs("/bx24/smarts/md5.min.js");
    Asset::getInstance()->addJs("/bx24/smarts/scriptn.js");
    $portalData = $app->getCurrentPortalData();
    $portalOldKey = '';
    if(!$portalData){
        $portalDataOld = $app->getCurrentPortalData('', 'N');
        if(isset($portalDataOld['PARAMS']['key'])){
            $portalOldKey = $portalDataOld['PARAMS']['key'];
        }
    }
    $authResult = null;
    $isAdmin = 0;
    $user_id = 0;
?>
    <?
                $tkn = array();
                $tkn['access_token'] = htmlspecialchars($app->getRequest()->get('AUTH_ID'));
                $tkn['client_endpoint'] = 'https://' .htmlspecialchars($app->getRequest()->get('DOMAIN')). '/rest/';
                $app->setAuth($tkn);
                $app->prepareBatchCached([
                    'app.option.get'=>'app.option.get',
                    'profile'=>'profile',
                ]);
                $currentUser = $app->getBatchCached('profile');
                if($currentUser->isSuccess()){
                    $currentUserData = $currentUser->getData();
                    if($currentUserData['result']['result']['ADMIN']){
                        $isAdmin = 1;
                    }
                    $user_id = intval($currentUserData['result']['result']['ID']);
                }
                ?>



    <div class="container"<?=(defined('CURRENT_PARENT_PLACEMENT') ? ' style="display:none;"' : '')?>><div class="row"><div class="ui-block-wrapper">
        <div class="ui-block-title">
            <div class="ui-block-title-text">Настройки синхронизации портала и сервиса api.zahalski.dev</div>
            <div class="ui-block-title-actions">
                <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
            </div>
        </div>
        <div class="ui-block-content active">
        <?
        if(!$portalData)
        {?>
            <?if($app->getRequest()->get('DOMAIN')){?>
                <div data-page="list" class="tab-content tab-content-list">
                    <div class="ui-alert ui-alert-warning">
                    <span class="ui-alert-message">
                    <strong>Внимание!</strong> Авторизуйте приложение на вашем портале,
                    необходима синхронизация ключей доступа к порталу и сервису.
                    </span>
                    </div>
                    <div class="col-xs-12" style="padding:10px 0;">
                        <a target="_blank" href="<?=$app->getAuthUrl($portalOldKey)?>" class="ui-btn ui-btn-success ui-btn-icon-success">Авторизация</a>
                    </div>
                </div>
            <?}?>
        <?
        }else{


            //app.option.get
            $authResult = $app->checkCurrentPortalSignKey();

            if($tracker){
                $tracker->setPortal($app->getRequest()->get('DOMAIN'))
                    ->setAppId($app->getConfig('APP_ID'));
            }

            if($authResult->isSuccess()){
                //C637F4BF62E470F6E053106C14AC66F0C637F4BF62E570F6E053106C14AC66F0

                $signer = new Security\Sign\Signer();

                $signedParameters = $signer->sign(base64_encode(serialize(array(
                    'domain'=>htmlspecialchars($app->getRequest()->get('DOMAIN')),
                    'key'=>$app->getCurrentPortalOption('auth'),
                    's_id'=>htmlspecialchars($app->getRequest()->get('AUTH_ID')),
                    'app_id'=>$app->getConfig('APP_ID'),
                    'admin'=>$isAdmin,
                    'user_id'=>$user_id
                ))));
                $gridKey = $app->getCurrentPortalOption('auth').'|'.$app->getRequest()->get('DOMAIN').'|'.$user_id.'|'.$app->getConfig('APP_ID');
                $hash = hash_hmac('sha256', $gridKey, $app->getConfig('APP_SECRET_CODE'));
                $gridKey .= '|'.$hash;
                $app->getRequest()->addFilter(new SetFilter('key', $gridKey));
                ?>
                <?
                $gridId = htmlspecialcharsEx((string) $app->getRequest()->get('grid_id') ? (string) $app->getRequest()->get('grid_id') : "");
                if(Loader::includeModule('awz.bxapistats')){
                    $tracker = \Awz\BxApiStats\Tracker::getInstance();
                    $addHtml = \Awz\BxApiStats\Helper::getHtmlStats($tracker, $gridId);
                    echo $addHtml;
                }
                ?>
                <div class="ui-alert ui-alert-success">Доступ к сервису активен.
                    После обновления приложения или блокировке API следует &nbsp;<a target="_blank" href="<?=$app->getAuthUrl($app->getCurrentPortalOption('auth'))?>">Обновить токен</a>
                </div>
        </div></div></div></div>
            <div class="container"<?=(defined('CURRENT_PARENT_PLACEMENT') ? ' style="display:none;"' : '')?>><div class="row"><div class="ui-block-wrapper">
                        <div class="ui-block-title">
                            <div class="ui-block-title-text">Настройки встроек</div>
                            <div class="ui-block-title-actions">
                                <a href="#" class="ui-block-title-actions-show-hide">Свернуть</a>
                            </div>
                        </div>
                        <div class="ui-block-content active">

                <div class="container">
                    <form>


                        <div class="row" style="margin-bottom:10px;">
                            <h4>Добавить встройку</h4>
                        </div>
                        <div class="row">
                        <div class="ui-alert ui-alert-warning awz-save-hook-params-empty">
                            <span class="ui-alert-message">
                            Для работы пользовательских гридов, обязательно добавить встройку на приложение!<br>
                                Приложение - Битрикс24 - Ссылка на приложение с параметрами
                            </span>
                        </div>
                        </div>
                        <div class="row" id="placement-sett-manager" style="margin-bottom:10px;">
                            <div class="col-xs-3 no-padding-l">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">что встраиваем</div>
                                    <select class="ui-ctl-element" id="placement-sett-manager-from">
                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-3">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">куда встраиваем</div>
                                    <select class="ui-ctl-element" id="placement-sett-manager-to">
                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-3">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">место встройки</div>
                                    <select class="ui-ctl-element" id="placement-sett-manager-type">
                                    </select>
                                </div>
                            </div>
                            <div style="display:block;clear:both;width:100%;height:10px;"></div>
                            <div class="col-xs-3 no-padding-l">
                                <div class="ui-ctl ui-ctl-textbox">
                                    <input type="text" id="placement-sett-manager-name" class="ui-ctl-element" placeholder="Название встройки">
                                </div>
                            </div>
                            <div class="col-xs-3">
                                <div class="ui-ctl ui-ctl-textbox">
                                    <input type="text" id="placement-sett-manager-group" class="ui-ctl-element" placeholder="Группа">
                                </div>
                            </div>
                            <div class="col-xs-3">
                                <div class="ui-ctl ui-ctl-textbox">
                                    <input type="text" id="placement-sett-manager-user" class="ui-ctl-element" placeholder="Пользователь">
                                </div>
                            </div>
                            <div class="col-xs-3 no-padding-r">
                                <a href="#" id="placement-sett-manager-add" class="ui-btn ui-btn-success ui-btn-icon-success">Активировать</a>
                            </div>
                        </div>

                        <div class="rows-smarts">

                        </div>

                        <div class="row" style="margin-bottom:10px;">
                            <h4>Добавить внешнюю сущность</h4>
                        </div>
                        <div class="row" id="external-entity" style="margin-bottom:10px;">
                            <div class="col-xs-3 no-padding-l">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">тип сущности</div>
                                    <select class="ui-ctl-element" id="external-entity-manager-from">
                                        <option value="task">Задачи</option>
                                        <option value="company">Компании</option>
                                        <option value="contact">Контакты</option>
                                        <option value="deal">Сделки</option>
                                        <option value="awzorm">AWZ: ORM Api</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-3">
                                <div class="ui-ctl ui-ctl-textbox">
                                    <input type="text" id="external-entity-manager-huk" class="ui-ctl-element" placeholder="Веб хук">
                                </div>
                            </div>
                            <div class="col-xs-3 no-padding-r">
                                <a href="#" id="external-entity-manager-add" class="ui-btn ui-btn-success ui-btn-icon-success">Добавить</a>
                            </div>
                        </div>
                        <div class="rows-ext-smarts">

                        </div>
                        <div class="row" style="margin-bottom:10px;">
                            <input type="hidden" data-domain="<?=htmlspecialchars($app->getRequest()->get('DOMAIN'))?>" data-app="<?=$app->getConfig('APP_ID')?>" id="signed_add_form" name="signed" value="<?=$signedParameters?>">
                        </div>
                    </form>
                </div>

                <?

            }else{
                echo Helper::errorsHtml($authResult, 'Ошибка получения опций приложения');
                ?>
                <?if($app->getRequest()->get('DOMAIN')){?>
                    <div data-page="list" class="tab-content tab-content-list">

                        <div class="col-xs-12 text-center" style="padding:10px 0;">
                            <a target="_blank" href="<?=$app->getAuthUrl($portalOldKey)?>" class="ui-btn ui-btn-success ui-btn-icon-success">Авторизация</a>
                        </div>
                    </div>
                <?}?>
                <?
            }

        }
        ?>
        </div>
    </div></div></div>
    <script>
        $(document).ready(function(){
            BX24.ready(function() {
                BX24.init(function () {
                    window.awz_helper.key = '<?=$app->getRequest()->get('key')?>';
                    window.awz_helper.gridId = '<?=$app->getRequest()->get('grid_id')?>';
                    window.awz_helper.MARKET_ID = '<?=($appId != 'app.63d6b637131902.97765356' ? $appId : 'awz.smartbag')?>';
                    window.awz_helper.APP_ID = '<?=$appId?>';
                    window.awz_helper.APP_URL = 'https://<?=$_SERVER['HTTP_HOST']?>/bx24/smarts/';
                    window.awz_helper.loadHandledApp(<?=(defined('CURRENT_PARENT_PLACEMENT') ? CURRENT_PARENT_PLACEMENT : 0)?>);
                });
            });
        });
    </script>
    <?if($authResult && $authResult->isSuccess()){

    $signer = new Security\Sign\Signer();
    $signedParameters = $signer->sign(base64_encode(serialize(array(
          'domain'=>htmlspecialchars($app->getRequest()->get('DOMAIN')),
          'key'=>$app->getCurrentPortalOption('auth'),
          's_id'=>htmlspecialchars($app->getRequest()->get('AUTH_ID')),
          'app_id'=>$app->getConfig('APP_ID')
      ))));

    //require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
    //require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/interface/admin_lib.php");



    ?>
    <style>
        .adm-header-wrap {display:none;}
        #menu_mirrors_cont {display:none;}
    </style>


    <?}?>
<?
}
?>
</div>
</div>
</body>
</html>
<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");