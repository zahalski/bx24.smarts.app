<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
if(!empty($allParamsPortalData['cleverSmart'])){
    $arParams['CLEVER_FIELDS'] = $allParamsPortalData['cleverfields'];
    $arParams['CLEVER_SMART'] = $allParamsPortalData['cleverSmart'];
}
