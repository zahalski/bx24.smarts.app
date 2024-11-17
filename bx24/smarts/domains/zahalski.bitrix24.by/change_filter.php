<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
if($arParams['GRID_OPTIONS']['PARAM_1'] === "DYNAMIC_177"){
    foreach($arParams['FIND'] as &$field){
        if($field['id'] == 'ufCrm10Type'){
            $field['params']['multiple'] = 'Y';
        }
    }
    unset($field);
}