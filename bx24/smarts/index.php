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
use Awz\bxApi\App;
use Awz\bxApi\Helper;

use Bitrix\Iblock\PropertyEnumerationTable;
use Bitrix\Main\Grid\Options as GridOptions;
use Bitrix\Main\UI\PageNavigation;

if(!Loader::includeModule('awz.bxapi')){
    return;
}

$tracker = null;
if(Loader::includeModule('awz.bxapistats')){
    $tracker = \Awz\BxApiStats\Tracker::getInstance();
    $tracker->addCount();
}

global $APPLICATION;
$appId = 'app.63d6b637131902.97765356';
if($_REQUEST['app']){
    $appId = htmlspecialcharsEx(trim($_REQUEST['app']));
}
$app = new App(array(
   'APP_ID'=>$appId,
   'APP_SECRET_CODE'=>Helper::getSecret($appId),
   //'LOG_FILENAME'=>'bx_log_save_txt_n_test2.txt',
   //'LOG_DIR'=>__DIR__
));

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <?
    Asset::getInstance()->addCss("/bitrix/css/main/bootstrap.css");
    Asset::getInstance()->addCss("/bitrix/css/main/font-awesome.css");
    Asset::getInstance()->addCss("/bx24/smarts/style.css");
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
$appViewType = 'admin';
if($app->getRequest()->get('PLACEMENT') === 'REST_APP_URI'){
    $appViewType = 'user';
}
?>
<body class="<?=$fraimeType?>"><div class="workarea">
<div class="container"><div class="row"><div class="result-block-messages"></div></div></div>
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
    UIExt::load("ui.buttons");
    UIExt::load("ui.buttons.icons");
    UIExt::load("ui.forms");
    UIExt::load("ui.alerts");
    UIExt::load("ui.fonts.opensans");
    UIExt::load("ui.hint");
    UIExt::load("ui.icons.b24");
    UIExt::load("ui.icons.service");
    Asset::getInstance()->addJs("/bx24/smarts/script.js");
    $portalData = $app->getCurrentPortalData();
    $authResult = null;
?>
    <div class="container"><div class="row"><div class="ui-block-wrapper">
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
                        <a target="_blank" href="<?=$app->getAuthUrl()?>" class="ui-btn ui-btn-success ui-btn-icon-success">Авторизация</a>
                    </div>
                </div>
            <?}?>
        <?
        }
        else
        {

            $authResult = $app->checkCurrentPortalSignKey();

            if($authResult->isSuccess()){
                //C637F4BF62E470F6E053106C14AC66F0C637F4BF62E570F6E053106C14AC66F0

                $signer = new Security\Sign\Signer();

                $signedParameters = $signer->sign(base64_encode(serialize(array(
                      'domain'=>htmlspecialchars($app->getRequest()->get('DOMAIN')),
                      'key'=>$app->getCurrentPortalOption('auth'),
                      's_id'=>htmlspecialchars($app->getRequest()->get('AUTH_ID')),
                      'app_id'=>$app->getConfig('APP_ID')
                  ))));

                if($tracker){
                    $tracker->setPortal($app->getRequest()->get('DOMAIN'))
                        ->setAppId($app->getConfig('APP_ID'));
                }

                ?>
                <div class="ui-alert ui-alert-success">Доступ к сервису активен</div>
                <div class="container">
                    <form>
                        <div class="row" style="margin-bottom:10px;">
                            <div class="col-xs-4 no-padding">
                                <label class="main-grid-control-label" for="app_key_prior">Встройка приложения (ссылка с параметрами)</label>
                            </div>
                            <div class="col-xs-3 app_handled">

                            </div>
                            <div class="col-xs-5">

                            </div>
                        </div>
                        <div class="row" style="margin-bottom:10px;">
                            <h4>Новая встройка сущности</h4>
                        </div>
                        <div class="row" id="placement-sett" style="margin-bottom:10px;">
                            <div class="col-xs-2 no-padding">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">что встраиваем</div>
                                    <select class="ui-ctl-element" id="select-crm-entity">

                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-2 no-padding">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">куда встраиваем</div>
                                    <select class="ui-ctl-element" id="select-crm-entity-to">

                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-3 no-padding">
                                <div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
                                    <div class="ui-ctl-after ui-ctl-icon-angle"></div>
                                    <div class="ui-ctl-tag">место встройки</div>
                                    <select class="ui-ctl-element" id="select-crm-entity-type">
                                        <option value="CRM_DETAIL_TAB">верхнее меню карточки (таб)</option>
                                        <option value="CRM_DETAIL_TOOLBAR">список приложений в карточке</option>
                                        <option value="CRM_LIST_TOOLBAR">кнопка возле роботов</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-xs-3 no-padding">
                                <div class="ui-ctl ui-ctl-textbox">
                                    <input type="text" id="select-crm-entity-name" class="ui-ctl-element" placeholder="Название встройки">
                                </div>
                            </div>
                            <div class="col-xs-2 no-padding">
                                <a href="#" class="add_smart_handled ui-btn ui-btn-success ui-btn-icon-success">Активировать</a>
                            </div>
                        </div>
                        <div class="row" style="margin-bottom:10px;">
                            <h4>Активные встройки</h4>
                        </div>
                        <div class="rows-smarts">

                        </div>
                        <div class="row" style="margin-bottom:10px;">
                            <input type="hidden" id="signed_add_form" name="signed" value="<?=$signedParameters?>">
                        </div>
                    </form>
                </div>

                <?

            }else{
                echo Helper::errorsHtml($authResult, 'Ошибка получения опций приложения');
            }

        }
        ?>
        </div>
    </div></div></div>
    <script>
        $(document).ready(function(){
            BX24.ready(function() {
                BX24.init(function () {
                    window.awz_helper.APP_ID = '<?=$appId?>';
                    window.awz_helper.APP_URL = 'https://<?=$_SERVER['HTTP_HOST']?>/bx24/smarts/';
                    window.awz_helper.loadHandledApp();
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