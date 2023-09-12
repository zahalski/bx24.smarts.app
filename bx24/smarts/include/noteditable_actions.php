<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
$arParams['ACTION_PANEL'] = [
    "GROUPS"=>[
        [
            "ITEMS"=>[
                \Awz\Admin\Helper::getGroupAction('delete')
            ]
        ]
    ]
];

\Awz\Admin\Helper::setCleverSmartParams($arParams, $checkAuthMember, $adminCustom);

\Bitrix\Main\UI\Extension::load("ui.progressbar");
\Bitrix\Main\UI\Extension::load('ui.entity-selector');
\Bitrix\Main\UI\Extension::load('ui.forms');
\Bitrix\Main\UI\Extension::load('ui.alerts');
\Bitrix\Main\UI\Extension::load('ui.layout-form');
$adminCustom->setParam('ACTION_PANEL', $arParams['ACTION_PANEL']);
$adminCustom->setParam('FIND',$adminCustom->formatFilterFields($arParams['FIND']));
$adminCustom->defaultInterface();