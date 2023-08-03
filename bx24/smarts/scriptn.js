'use strict';
function AwzBx24PageManager(){};
AwzBx24PageManager.prototype = {
    init: function(options){
        this.initHandlers();
        window.AwzBx24PageManager_ob = this;
        return this;
    },
    hidePages: function(){
        $('.appWrap').hide();
        $('.result-block-messages').html('');
    },
    showPage: function(page){
        $('.appWrap').hide();
        var pageExists = false;
        $('.appWrap').each(function(){
            if($(this).attr('data-page') == page){
                $(this).show();
                pageExists = true;
            }
        });
        if(!pageExists){
            $('.appWrap').eq(0).show();
        }
        $('.result-block-messages').html('');
    },
    getPageEl: function(page){
        var el = null;
        $('.appWrap').each(function(){
            if($(this).attr('data-page') == page){
                el = $(this);
            }
        });
        return el;
    },
    scrollTop: function(){
        $('html').scrollTop(0);
        try{
            BX24.scrollParentWindow(0);
        }catch (e) {
        }
    },
    showMessage: function(msg, el){
        if(!el) el = $('.result-block-messages');
        el.html(msg);
        this.scrollTop();
    },
    initHandlers: function(){
        $(document).on('click', '.ui-block-title-actions-show-hide', function(e){
            e.preventDefault();
            var parent = $(this).parents('.ui-block-wrapper');
            if(parent.find('.ui-block-content').hasClass('active')){
                parent.find('.ui-block-content').removeClass('active');
                $(this).html('Развернуть');
            }else{
                parent.find('.ui-block-content').addClass('active');
                $(this).html('Свернуть');
            }
        });
        $(document).on('click','.awz-handler-slide',function(e){
            if(!!e) e.preventDefault();
            var data = $(this).data();
            var url = $(this).attr('href');
            if($(this).attr('data-page')){
                url = '/bx24/smarts/pages/'+$(this).attr('data-page')+'.php';
            }
            BX.SidePanel.Instance.open(
                url,
                {
                    requestMethod: 'post',
                    requestParams: data,
                    cacheable: false
                }
            );
            window.AwzBx24PageManager_ob.scrollTop();
        });
        $(document).on('click','.awz-handler-slide-content',function(e){
            if(!!e) e.preventDefault();
            window.AwzBx24PageManager_ob.query_data = $(this).data();
            window.AwzBx24PageManager_ob.query_data['html'] = 'Y';
            window.AwzBx24PageManager_ob.url = '/bx24/smarts/pages/'+$(this).attr('data-page')+'.php';
            BX.SidePanel.Instance.open(
                md5(window.AwzBx24PageManager_ob.url),
                {
                    contentCallback: function(slider){
                        return new Promise((resolve, reject) => {
                            $.ajax({
                                url: window.AwzBx24PageManager_ob.url,
                                data: window.AwzBx24PageManager_ob.query_data,
                                dataType : "html",
                                type: "POST",
                                CORS: false,
                                crossDomain: true,
                                timeout: 180000,
                                async: false,
                                success: function (data, textStatus){
                                    window.AwzBx24PageManager_ob.scrollTop();
                                    resolve({ html: '<div class="slide_side_slider"><div class="workarea">'+data+'</div></div>' });
                                },
                                error: function (err){
                                    window.AwzBx24PageManager_ob.scrollTop();
                                    resolve({
                                        html: '<div class="slide_side_slider"><div class="workarea">Ошибка загрузки страницы с сервиса приложения</div></div>',
                                        message: 'app error',
                                        type: 'error'
                                    });
                                }
                            });
                        });
                    },
                    cacheable: false
                }
            );
        });
    }
};
function AwzBx24PlacementManager(){};
AwzBx24PlacementManager.prototype = {
    shortCodes: {
        'TASK_USER_LIST_TOOLBAR':'1'
    },
    placements: {
        'codes':[]
    },
    onAfterShow: function(from, to, type, name){},
    addHandler: function(from, to, type, name){},
    onBeforeGetList: function(option, from, to){
        if(!from) return false;
        if(!to) return false;
        if(!option) return false;
        if(typeof option !== 'object') return false;
        return true;
    },
    getPlacementCodeShort: function(code, short){
        //code = String(code);
        if(short){
            if(this.shortCodes.hasOwnProperty(code)){
                return this.shortCodes[code];
            }
            return code;
        }
        if(this.shortCodes.hasOwnProperty(code)){
            return code;
        }
        var k;
        for(k in this.shortCodes){
            if(this.shortCodes[k] === code)
                return k;
        }
        return code;
    },
    init: function(options){
        if(!options) options = {};
        if(options.hasOwnProperty('placements')){
            this.add(options['placements']);
        }
        if(options.hasOwnProperty('onBeforeGetList') &&
            !!options['onBeforeGetList'] &&
            typeof options['onBeforeGetList'] === 'function'
        ){
            this.onBeforeGetList = options['onBeforeGetList'];
        }
        if(options.hasOwnProperty('onAfterShow') &&
            !!options['onAfterShow'] &&
            typeof options['onAfterShow'] === 'function'
        ){
            this.onAfterShow = options['onAfterShow'];
        }
        if(options.hasOwnProperty('addHandler') &&
            !!options['addHandler'] &&
            typeof options['addHandler'] === 'function'
        ){
            this.addHandler = options['addHandler'];
        }
        this.initHandlers();
        return this;
    },
    getPlacementNames: function(){
        var k;
        var items = {};
        for(k in this.placements.codes){
            var pls = this.placements.codes[k];
            items[pls.value] = pls.title;
        }
        return items;
    },
    add: function(placements){
        var k;
        for (k in placements){
            var p = placements[k];
            this.placements.codes.push(p);
        }
    },
    getList: function(from, to){
        var placements = [];
        var k;
        for(k in this.placements.codes){
            var p = this.placements.codes[k];
            if(this.onBeforeGetList(p, from, to)){
                placements.push(p);
            }
        }
        return placements;
    },
    show: function(step){
        if(!step) step = 1;
        if(step === 1){
            $('#placement-sett-manager-from').html('<option value="">выберите сущность</option>');
            $('#placement-sett-manager-to').html('<option value="">выберите сущность</option>').parent().addClass('ui-ctl-disabled');
            $('#placement-sett-manager-type').html('<option value="">выберите место встройки</option>').parent().addClass('ui-ctl-disabled');
            $('#placement-sett-manager-name').val('').parent().addClass('ui-ctl-disabled');
        }
        if(step === 2){
            var val1 = $('#placement-sett-manager-from').val();
            if(!val1) {
                return this.show();
            }
            $('#placement-sett-manager-to').html('<option value="">выберите сущность</option>').parent().removeClass('ui-ctl-disabled');
            $('#placement-sett-manager-type').html('<option value="">выберите место встройки</option>').parent().addClass('ui-ctl-disabled');
            $('#placement-sett-manager-name').parent().addClass('ui-ctl-disabled');
        }
        if(step === 3){
            var val1 = $('#placement-sett-manager-from').val();
            if(!val1) {
                return this.show();
            }
            var val2 = $('#placement-sett-manager-to').val();
            if(!val2) {
                return this.show(2);
            }
            $('#placement-sett-manager-type').html('').parent().removeClass('ui-ctl-disabled');
            $('#placement-sett-manager-name').parent().removeClass('ui-ctl-disabled');
        }
        this.showFrom();
        this.showTo();
        this.showType();

        var v = this.getValues();
        this.onAfterShow(v['from'],v['to'],v['type'], v['name']);
    },
    getValues: function(){
        return {
            'from':$('#placement-sett-manager-from').val(),
            'to':$('#placement-sett-manager-to').val(),
            'type':$('#placement-sett-manager-type').val(),
            'name':$('#placement-sett-manager-name').val()
        };
    },
    removeFrom: function(options){
        this.from = [];
    },
    removeTo: function(options){
        this.to = [];
    },
    removeType: function(options){
        this.type = [];
    },
    addOptionHtml: function(node, option){
        var check = false;
        var nodeId = '#placement-sett-manager-'+node;
        $(nodeId).find('option').each(function(){
            if($(this).attr('value') === option.value) {
                check = true;
                return false;
            }
        });
        if(!check){
            var dataCode = option.hasOwnProperty('data-code') ? option['data-code'] : '';
            $(nodeId).append('<option data-code="'+dataCode+'" value="'+option.value+'">'+option.title+'</option>');
        }

    },
    appendFrom: function(option){
        if(!this.hasOwnProperty('from')) this.from = [];
        var check = false;
        var k;
        for(k in this.from) {
            var option_row = this.from[k];
            if(option_row.value === option.value){
                check = true;
                break;
            }
        }
        if(!check) this.from.push(option);
        this.addOptionHtml('from', option);
    },
    appendTo: function(option){
        if(!this.hasOwnProperty('to')) this.to = [];
        var check = false;
        var k;
        for(k in this.to) {
            var option_row = this.to[k];
            if(option_row.value === option.value){
                check = true;
                break;
            }
        }
        if(!check) this.to.push(option);
        this.addOptionHtml('to', option);
    },
    appendType: function(option){
        if(!this.hasOwnProperty('type')) this.type = [];
        var check = false;
        var k;
        for(k in this.type) {
            var option_row = this.type[k];
            if(option_row.value === option.value){
                check = true;
                break;
            }
        }
        if(!check) this.type.push(option);
        this.addOptionHtml('type', option);
    },
    showFrom: function(options){
        if(!this.hasOwnProperty('from')) this.from = [];
        if(!options) {
            options = this.from;
        }
        var k;
        for(k in options){
            var option = options[k];
            if(typeof option !== 'object') continue;
            if(!option.hasOwnProperty('value')) continue;
            if(!option.hasOwnProperty('title')) continue;
            this.appendFrom(option);
        }
    },
    showTo: function(options){
        if(!this.hasOwnProperty('to')) this.to = [];
        if(!options) {
            options = this.to;
        }
        var k;
        for(k in options){
            var option = options[k];
            if(typeof option !== 'object') continue;
            if(!option.hasOwnProperty('value')) continue;
            if(!option.hasOwnProperty('title')) continue;
            this.appendTo(option);
        }
    },
    showType: function(options){
        var from = $('#placement-sett-manager-from').val();
        var to = $('#placement-sett-manager-to').val();
        this.type = this.getList(from, to);
        if(!options) {
            options = this.type;
        }
        var k;
        for(k in options){
            var option = options[k];
            if(typeof option !== 'object') continue;
            if(!option.hasOwnProperty('value')) continue;
            if(!option.hasOwnProperty('title')) continue;
            this.appendType(option);
        }

        var val3 = $('#placement-sett-manager-type').val();
        if(!val3) {
            $('#placement-sett-manager-add').addClass('ui-btn-disabled');
        }else{
            $('#placement-sett-manager-add').removeClass('ui-btn-disabled');
        }
    },
    initHandlers: function(){
        var parentConstructor = this;
        $(document).on('change', '#placement-sett-manager-from', function(){
            parentConstructor.show(2);
        });
        $(document).on('change', '#placement-sett-manager-to', function(){
            parentConstructor.show(3);
        });
        $(document).on('click', '#placement-sett-manager-add', function(e){
            e.preventDefault();
            var v = parentConstructor.getValues();
            parentConstructor.addHandler(v['from'],v['to'],v['type'], v['name']);
        });
    },
};
function AwzBx24EntityLoader(){};
AwzBx24EntityLoader.prototype = {
    cashed: {},
    clearCache: function(){
        this.cashed = {};
    },
    entKeys: {
        'awz_employee':{
            'caption': 'сотрудник','short':'',
            'tab':'Сотрудники',
            'alias':['EMPLOYEE','crm_employee','employee'],
            'm_list':'user.get',
            'm_search':'user.get',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#,\'USER_TYPE\':"employee"},\'start\':-1}',
            'm_search_params':'{\'filter\':{\'NAME_SEARCH\':"#QUERY#",\'USER_TYPE\':"employee"},\'start\':-1}',
        },
        'awz_user':{
            'caption': 'пользователь','short':'',
            'tab':'Пользователь',
            'alias':['USER','crm_user','user'],
            'm_list':'user.get',
            'm_search':'user.get',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#,\'USER_TYPE\':"employee"},\'start\':-1}',
            'm_search_params':'{\'filter\':{\'NAME_SEARCH\':"#QUERY#"},\'start\':-1}',
        },
        'group':{
            'caption': 'группа','short':'',
            'tab':'Группа',
            'alias':['GROUP','awz_group'],
            'm_list':'sonet_group.get',
            'm_search':'sonet_group.get',
            'm_list_params':'{\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
            'm_search_params':'{\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
        },
        'company':{
            'caption': 'компания','short':'CO',
            'tab':'Компании',
            'alias':['COMPANY','crm_company'],
            'm_list':'crm.company.list',
            'm_search':'crm.company.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
        },
        'quote':{
            'caption': 'предложение','short':'Q',
            'tab':'Предложения',
            'alias':['QUOTE','crm_quote'],
            'm_list':'crm.quote.list',
            'm_search':'crm.quote.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
        },
        'contact':{
            'caption': 'контакт','short':'C',
            'tab':'Контакты',
            'alias':['CONTACT','crm_contact'],
            'm_list':'crm.contact.list',
            'm_search':'crm.contact.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'LAST_NAME\',\'DATE_CREATE\']}',
            'm_search_params':'[' +
                '{\'filter\':{\'%NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'LAST_NAME\',\'DATE_CREATE\']},' +
                '{\'filter\':{\'%LAST_NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'LAST_NAME\',\'DATE_CREATE\']}' +
            ']',
        },
        'deal':{
            'caption': 'сделка','short':'D',
            'tab':'Сделки',
            'alias':['DEAL','crm_deal'],
            'm_list':'crm.deal.list',
            'm_search':'crm.deal.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
        },
        'lead':{
            'caption': 'лид','short':'L',
            'tab':'Лиды',
            'alias':['LEAD','crm_lead'],
            'm_list':'crm.lead.list',
            'm_search':'crm.lead.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
        },
        'smart_invoice':{
            'caption': 'счет','short':'SI',
            'tab':'Счета',
            'alias':['SMART_INVOICE','crm_smart_invoice'],
            'm_list':'crm.item.list',
            'list_key':'items',
            'm_search':'crm.item.list',
            'm_list_params':'{\'entityTypeId\':31,\'filter\':{\'id\':#IDS#},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\']}',
            'm_search_params':'{\'entityTypeId\':31,\'filter\':{\'%title\':"#QUERY#"},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\']}',
        },
    },
    dinamicLoaded: false,
    dinamicLoadedIbSect: false,
    dinamicLoadedIbEl: false,
    getLink:function(ent, id){
        var lnk = this.getEntityParam(ent, 'link');
        if(!lnk) return false;
        return lnk.replace('#ID#',id);
    },
    setHookListDinamic: function(){
        var q_data_hook = {
            'domain':$('#signed_add_form').attr('data-domain'),
            'app':$('#signed_add_form').attr('data-app'),
            'signed':$('#signed_add_form').val()
        };
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
        this['entKeys']['awz_placementlist']['m_list_params'] =
            this['entKeys']['awz_placementlist']['m_list_params']
                .replace('#domain#',$('#signed_add_form').attr('data-domain'));
        this['entKeys']['awz_placementlist']['m_list_params'] =
            this['entKeys']['awz_placementlist']['m_list_params']
                .replace('#app#',$('#signed_add_form').attr('data-app'));
        this['entKeys']['awz_placementlist']['m_list_params'] =
            this['entKeys']['awz_placementlist']['m_list_params']
                .replace('#signed#',$('#signed_add_form').val());
        this['entKeys']['awz_placementlist']['m_search_params'] =
            this['entKeys']['awz_placementlist']['m_search_params']
                .replace('#domain#',$('#signed_add_form').attr('data-domain'));
        this['entKeys']['awz_placementlist']['m_search_params'] =
            this['entKeys']['awz_placementlist']['m_search_params']
                .replace('#app#',$('#signed_add_form').attr('data-app'));
        this['entKeys']['awz_placementlist']['m_search_params'] =
            this['entKeys']['awz_placementlist']['m_search_params']
                .replace('#signed#',$('#signed_add_form').val());
        this['entKeys']['awz_placementlist']['url'] = '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.';
        this['entKeys']['awz_placementlist']['link'] = '/marketplace/view/'+window.awz_helper.MARKET_ID+'/?params[HOOK]=#ID#';
    },
    loadIblockEntity: function(start){
        if(this.dinamicLoadedIbEl) return;
        if(!start) start = 0;
        var parent = this;

        window.AwzBx24Proxy.callBatch({
            'catalog':{
                'method':'catalog.catalog.list',
                'params':{}
            },
            'lists':{
                'method':'lists.get',
                'params':{'IBLOCK_TYPE_ID':'lists'}
            },
            'bitrix_processes':{
                'method':'lists.get',
                'params':{'IBLOCK_TYPE_ID':'bitrix_processes'}
            },
            'structure':{
                'method':'lists.get',
                'params':{'IBLOCK_TYPE_ID':'structure'}
            },
            'lists_socnet':{
                'method':'lists.get',
                'params':{'IBLOCK_TYPE_ID':'lists_socnet'}
            },
        }, function(result){
            //console.log(result);
            var instance = window.AwzBx24EntityLoader_ob;
            if(window.awz_helper && window.awz_helper.hasOwnProperty('addBxTime')){
                window.awz_helper.addBxTime(result);
            }
            try{
                var k;
                for(k in result){
                    var row = result[k];
                    var itr = null;
                    var k2;
                    if(row.hasOwnProperty('answer') && row['answer'].hasOwnProperty('result')){
                        itr = row['answer']['result'];
                        if(itr.hasOwnProperty('catalogs')){
                            itr = itr['catalogs'];
                        }
                    }else if(row.hasOwnProperty('length')){
                        itr = row;
                    }
                    if(itr){
                        for(k2 in itr){
                            var type = itr[k2];
                            instance.setDynamicEntity(type, k);
                        }
                    }
                }
            }catch (e) {
                console.log(e);
            }
            instance.dinamicLoadedIbEl = true;
        });
    },
    loadIblockSectionEntity: function(start){

    },
    loadDynamicCrm: function(start){
        if(this.dinamicLoaded) return;
        if(!start) start = 0;
        var parent = this;

        window.awz_helper.callApi('crm.type.list', {
                'order':{"title": "ASC"},
                'start':start
            }, function(res){
                if(window.awz_helper && window.awz_helper.hasOwnProperty('addBxTime')){
                    window.awz_helper.addBxTime(res);
                }
                try{
                    var k;
                    for(k in res['result']['types']){
                        var type = res['result']['types'][k];
                        parent.setDynamicEntity(type);
                    }
                }catch (e) {

                }
                parent.dinamicLoaded = true;
            }
        );
    },
    setDynamicEntity: function(type, key){
        //console.log(['setDynamicEntity', type, key]);
        if(key === 'bitrix_processes'){
            this.entKeys['bitrix_processes_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['BITRIX_PROCESSES_'+type['ID'], 'iblock_element_'+type['ID']],
                'm_list':'lists.element.get',
                'm_search':'lists.element.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'bitrix_processes\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'bitrix_processes\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
            };
        }else if(key === 'catalog'){
            this.entKeys['catalog_'+type['iblockId']] = {
                'caption': type['name'],'short':'',
                'tab':type['name'],
                'alias':['CATALOG_'+type['iblockId'], 'iblock_element_'+type['iblockId']],
                'm_list':'crm.product.list',
                'm_search':'crm.product.list',
                'm_list_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'CURRENCY_ID\',\'PRICE\',\'DATE_CREATE\']}',
                'm_search_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'%NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'CURRENCY_ID\',\'PRICE\',\'DATE_CREATE\']}',
            };
            this.entKeys['s_catalog_'+type['iblockId']] = {
                'caption': type['name'],'short':'',
                'tab':type['name'],
                'alias':['S_CATALOG_'+type['iblockId'], 'iblock_section_'+type['iblockId']],
                'm_list':'crm.productsection.list',
                'm_search':'crm.productsection.list',
                'm_list_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'SECTION_ID\']}',
                'm_search_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'%NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'SECTION_ID\']}',
            };
        }else if(key === 'lists'){
            this.entKeys['list_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['LIST_'+type['ID'], 'iblock_element_'+type['ID']],
                'm_list':'lists.element.get',
                'm_search':'lists.element.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
            };
            this.entKeys['s_list_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['S_LIST_'+type['ID'], 'iblock_section_'+type['ID']],
                'm_list':'lists.section.get',
                'm_search':'lists.section.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
            };
        }else if(key === 'structure'){
            this.entKeys['structure_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['STRUCTURE_'+type['ID'], 'iblock_element_'+type['ID']],
                'm_list':'lists.element.get',
                'm_search':'lists.element.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'structure\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'structure\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
            };
        }else if(key === 'lists_socnet'){

        }else if(!key){
            this.entKeys['dynamic_'+type['entityTypeId']] = {
                'caption': type['title'],'short':'T'+parseInt(type['entityTypeId']).toString(16),
                'tab':type['title'],
                'alias':['DYNAMIC_'+type['entityTypeId'],'crm_dynamic_'+type['entityTypeId']],
                'm_list':'crm.item.list',
                'list_key':'items',
                'm_search':'crm.item.list',
                'm_list_params':'{\'entityTypeId\':'+type['entityTypeId']+',\'filter\':{\'id\':#IDS#},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\']}',
                'm_search_params':'{\'entityTypeId\':'+type['entityTypeId']+',\'filter\':{\'%title\':"#QUERY#"},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\']}',
            };
        }
    },
    getEntityCode: function(code, repl){
        if(this.entKeys.hasOwnProperty(code)) return code;

        var k;
        for(k in this.entKeys){
            if(this.entKeys[k].hasOwnProperty('alias') &&
                typeof this.entKeys[k]['alias']=='object' &&
                this.entKeys[k]['alias'].hasOwnProperty('length') &&
                this.entKeys[k]['alias'].indexOf(code)>-1
            ){
                return k;
            }
        }
        if(!repl && code.toLowerCase().indexOf('dynamic_')>-1){
            this.loadDynamicCrm();
            if(!this.entKeys.hasOwnProperty(code.toLowerCase())){
                var entityTypeId = code.toLowerCase().replace('dynamic_','');
                var type = {'entityTypeId':entityTypeId, 'title': 'смарт '+entityTypeId};
                this.setDynamicEntity(type);
                return this.getEntityCode(code, true);
            }
        }
        if(!repl && code.toLowerCase().indexOf('iblock_element_')>-1){
            this.loadIblockEntity();
        }
        if(!repl && code.toLowerCase().indexOf('iblock_section_')>-1){
            this.loadIblockSectionEntity();
        }
        return false;
    },
    format:function(type, val){
        if(type === 'date'){
            var dt = new Date(val);
            return dt.toLocaleDateString("ru-RU");
        }else if(type === 'currency'){
            var codes = {
                'RUB':'₽',
                'BYN':'б.руб.',
                'USD':'$',
                'EUR':'€',
            };
            var dt = val.split('|');
            if(dt.length == 2){
                if(codes.hasOwnProperty(dt[1])){
                    dt[1] = codes[dt[1]];
                    return dt[0]+' '+dt[1];
                }
            }
        }
        return val;
    },
    set: function(type, itm, itm_resp){
        if(!type) return;

        var p_id = '';
        p_id = $('.awz-autoload-'+type+'-'+itm['id']).attr('data-id');
        if($('.awz-autoload-'+type+'-'+itm['id']).attr('data-ido')){
            p_id = $('.awz-autoload-'+type+'-'+itm['id']).attr('data-ido');
        }

        var k;
        for(k in itm){
            if(itm[k] === null) itm[k] = '';
        }
        for(k in itm_resp){
            if(itm_resp[k] === null) itm_resp[k] = '';
        }
        this.cashed[type][itm['id']] = itm;
        var ht = '';
        if(['awz_user','awz_employee'].indexOf(type)>-1){
            ht += '<div class="tasks-grid-username-wrapper" style="margin-bottom:7px;">';
            ht += '<a class="tasks-grid-username open-smart" data-ent="'+type+'" data-id="'+itm['id']+'" href="#">';
            ht += '<span class="tasks-grid-avatar ui-icon ui-icon-common-user">';
            var image = '';
            if(itm.hasOwnProperty('avatar')){
                image = itm['avatar'];
            }
            ht += "<i style=\"background-image: url('"+image+"')\"></i>";
            ht += '</span>';
            ht += '<span class="tasks-grid-username-inner">'+itm['title']+'</span>';
            ht += '<span class="tasks-grid-filter-remove"></span>';
            ht += '</a>';
            ht += '</div>';
        }else if(['group'].indexOf(type)>-1){
            ht += '<div class="tasks-grid-username-wrapper" style="margin-bottom:7px;">';
            ht += '<a class="tasks-grid-group open-smart" data-ent="'+type+'" data-id="'+itm['id']+'" href="#">';
            ht += '<span class="tasks-grid-avatar ui-icon ui-icon-common-user-group">';
            var image = '';
            if(itm.hasOwnProperty('avatar')){
                image = itm['avatar'];
            }
            ht += "<i style=\"background-image: url('"+image+"')\"></i>";
            ht += '</span>';
            ht += '<span class="tasks-grid-group-inner">'+itm['title']+'</span>';
            ht += '<span class="tasks-grid-filter-remove"></span>';
            ht += '</a>';
            ht += '</div>';
        }else{
            ht += '<div class="awz-grid-item1-wrapper">';
            ht += '<a class="open-smart" data-id="'+itm['id']+'" data-ent="'+type+'" href="#">['+p_id+'] '+itm['title']+'</a>';
            if(itm.hasOwnProperty('subtitle') && itm['subtitle']){
                ht += '<span class="subtitle">'+itm['subtitle']+'</span>';
            }
            ht += '</div>';
        }
        $('.awz-autoload-'+type+'-'+itm['id'])
            .html(ht)
            .removeClass('awz-loaded-field')
            .addClass('awz-loaded-field');
    },
    getCache: function(type, id){
        if(!type) return false;
        if(!this.cashed.hasOwnProperty(type)){
            return false;
        }
        if(this.cashed[type].hasOwnProperty(id)){
            this.set(type, this.cashed[type][id]);
            return true;
        }
        return false;
    },
    load: function (cur_cnt){
        if(!cur_cnt) cur_cnt = 1;
        if(cur_cnt>5) return;
        var parent = this;
        var ids = {};
        var batchCaller = {};
        $('.awz-autoload-field').each(function(){
            var id = $(this).attr('data-id');
            var type = $(this).attr('data-type');
            if(!!type && !!id && !$(this).hasClass('awz-loaded-field')){
                var type_main = parent.getEntityCode(type);
                if(type_main){
                    if(!ids.hasOwnProperty(type_main)){
                        ids[type_main] = [];
                    }
                    if(type_main != type){
                        $(this).removeClass('awz-autoload-'+type_main+'-'+id)
                            .addClass('awz-autoload-'+type_main+'-'+id);
                    }
                    if(ids[type_main].length>=50) return;
                    if(!parent.cashed.hasOwnProperty(type_main)){
                        parent.cashed[type_main] = {};
                    }
                    if(!parent.getCache(type_main, id) && ids[type_main].indexOf(id)===-1){
                        ids[type_main].push(id);

                        var itm = parent.createItemOptions({'id':id}, type_main);
                        if(!itm){
                            $(this).addClass('awz-loaded-field');
                        };
                        parent.cashed[type_main][id] = itm;
                    }
                }
            }
        });
        var k;
        var batch_start = false;
        var batch_cnt = 0;
        for(k in ids){
            if(!ids[k].length) continue;
            var method = this.getMethodList(k);
            var method_params = this.getEntityParam(k, 'm_list_params');
            if(method && method_params){
                var batch_dissable = this.getEntityParam(k, 'batch_dissable');
                if(batch_dissable){
                    try{
                        var tmp_method = this.getEntityParam(k,'url') ? [this.getEntityParam(k,'url'), method] : method;
                        eval("var tmp_params = "+method_params.replace('#IDS#','["'+ids[k].join('","')+'"]')+";");
                        window.awz_helper.callApi(tmp_method, tmp_params, function(res){
                            try{
                                var instance = window.AwzBx24EntityLoader_ob;
                                var k2;
                                var row = res['result'];
                                var listKey = window.AwzBx24EntityLoader_ob.getEntityParam(k, 'list_key');
                                var itr = null;
                                if(listKey){
                                    itr = row[listKey];
                                }else{
                                    itr = row;
                                }
                                if(itr){
                                    for(k2 in itr){
                                        var itm = itr[k2];
                                        var item = instance.createItemOptions(itm, k);
                                        instance.set(k, item, itm);
                                    }
                                }
                                window.awz_helper.resize();
                                instance.load(instance.cur_cnt);
                            }catch (e) {

                            }
                        });
                    }catch (e) {
                        console.log(e);
                    }
                }else{
                    if(!batchCaller.hasOwnProperty(k)){
                        batchCaller[k] = {};
                        batch_cnt+=1;
                    }
                    try{
                        batchCaller[k]['method'] = method;
                        eval("batchCaller[k]['params'] = "+method_params.replace('#IDS#','["'+ids[k].join('","')+'"]')+";");
                        batch_start = true;
                    }catch (e) {
                        delete batchCaller[k];
                        console.log(e);
                    }
                }
            }
        }

        if(batch_start){
            var nbatchCaller = {};
            var k;
            var cn = 0;
            for(k in batchCaller){
                cn+=1;
                if(cn<=50){
                    nbatchCaller[k] = batchCaller[k];
                    var k2;
                    for(k2 in ids[k]){

                    }
                }else{
                    break;
                }
            }
            batchCaller = nbatchCaller;
            //console.log(['batchCaller', batchCaller]);
            window.AwzBx24EntityLoader_ob.cur_cnt = cur_cnt+1;
            window.AwzBx24Proxy.callBatch(batchCaller, function(result){
                //console.log(result);
                var instance = window.AwzBx24EntityLoader_ob;
                if(window.awz_helper && window.awz_helper.hasOwnProperty('addBxTime')){
                    window.awz_helper.addBxTime(result);
                }
                try{
                    var k;
                    for(k in result){
                        var row = result[k];
                        var listKey = window.AwzBx24EntityLoader_ob.getEntityParam(k, 'list_key');
                        var itr = null;
                        var k2;
                        if(row.hasOwnProperty('answer') && row['answer'].hasOwnProperty('result')){
                            if(listKey){
                                itr = row['answer']['result'][listKey];
                            }else{
                                itr = row['answer']['result'];
                            }
                        }else if(!listKey && row.hasOwnProperty('length')){
                            itr = row;
                        }else if(listKey && row.hasOwnProperty(listKey) && row[listKey].hasOwnProperty('length')){
                            itr = row[listKey];
                        }
                        if(itr){
                            for(k2 in itr){
                                var itm = itr[k2];
                                var item = instance.createItemOptions(itm, k);
                                instance.set(k, item, itm);
                            }
                        }
                        window.awz_helper.resize();
                        instance.load(instance.cur_cnt);
                    }
                }catch (e) {
                    console.log(e);
                }
            });
        }
    },
    searchTimeouts: null,
    search: function(entries){

        if(this.searchTimeouts){
            clearInterval(this.searchTimeouts);
            this.searchTimeouts = null;
        }

        if(!this.lastTab) return;

        var query = this.dialog.getTagSelector().getTextBoxValue();
        if(query) this.lastQuery = query;
        //console.log(query);

        this.setQueryFooter();

        if(this.lastTab && this.lastQueryTabs.hasOwnProperty(this.lastTab) &&
            this.lastQueryTabs[this.lastTab] === this.lastQuery){
            return;
        }
        this.lastQueryTabs[this.lastTab] = this.lastQuery;

        if(!entries) entries = this.lastEntries;

        var parent = this;
        var k;
        for(k in entries){
            var ent_code = this.getEntityCode(entries[k]);
            if(this.lastTab === ent_code){
                var method = this.getEntityParam(ent_code, 'm_search');
                var method_url = this.getEntityParam(ent_code, 'url');
                try{
                    var method_params;
                    eval('method_params = '+this.getEntityParam(ent_code, 'm_search_params').replaceAll('#QUERY#',parent.lastQuery)+';');
                    if(!method_params.hasOwnProperty('length')){
                        method_params = [method_params];
                    }
                    parent.dialog.getEntityItems(ent_code).forEach(function(item){
                        if(!item.isSelected()) parent.dialog.removeItem(item);
                    });
                    var k2;
                    for(k2 in method_params){
                        window.awz_helper.callApi(
                            method_url ? [method_url, method] : method,
                            method_params[k2],
                            function(res){
                                var k3;
                                var listKey = parent.getEntityParam(ent_code, 'list_key');
                                var itr = null;
                                if(listKey){
                                    itr = res['result'][listKey];
                                }else{
                                    itr = res['result'];
                                }
                                for(k3 in itr){
                                    var itm = itr[k3];
                                    parent.dialog.addItem(parent.createItemOptions(itm, ent_code));
                                }
                            }
                        );
                    }
                }catch (e) {
                    console.log(e);
                }
                return;
            }
        }
    },
    lastEntries: [],
    lastQuery: '',
    lastQueryTabs: {},
    lastTab: '',
    lastQueryTime: null,
    reloadDialog: function(){
        this.lastQuery = '';
        this.lastQueryTabs = {};
        this.lastQueryTime = null;
        this.lastEntries = [];
        this.lastTab = '';
        this.dialog = null;
    },
    setQueryFooter: function(){
        var q = this.lastQuery;
        var ht = '<div class="awz-dialog-search-help">';
        if(q){
            ht += 'Показаны элементы для запроса: <b style="color:red;">'+q+'</b>';
        }else{
            ht += 'Пустой поисковой запрос, введите текст и нажмите <b>Enter</b> в строке поиска';
        }
        ht += '</div>';
        this.dialog.setFooter(ht);
    },
    getCurrentElements: function(nodeId){
        var current_elements = [];
        var keys = this.entKeys;
        try{
            var inpVal = $(nodeId).val().split(',');
            var k;
            for (k in inpVal){
                if(!inpVal[k]) continue;
                if(inpVal[k].indexOf('_')>-1){
                    var k2;
                    for(k2 in keys){
                        var shortCode = this.getEntityParam(k2,'short');
                        if(shortCode && inpVal[k].indexOf(shortCode+'_')>-1){
                            var itm = {
                                'id':inpVal[k].replace(shortCode+'_','',inpVal[k]),
                                'title':inpVal[k]
                            };
                            current_elements.push(this.createItemOptions(itm, k2));
                        }
                    }
                }else{
                    var itm = {
                        'id':inpVal[k]
                    };
                    current_elements.push(this.createItemOptions(itm, 'auto'));
                }
            }
        }catch (e) {
            console.log(e);
        }
        return current_elements;
    },
    getMethodList: function(entity){
        return this.getEntityParam(entity, 'm_list');
    },
    getEntityParam: function(entity, key){
        if(!key) return false;
        entity = this.getEntityCode(entity);
        if(key === 'type'){
            return entity;
        }
        var keys = (typeof key == 'object') ? key : [key];

        if(this.entKeys.hasOwnProperty(entity)){
            var k;
            for(k in keys){
                if(this.entKeys[entity].hasOwnProperty(keys[k])){
                    return this.entKeys[entity][keys[k]];
                }
            }
        }
        return false;
    },
    replaceItemFromItm: function(itm, type){
        var item = this.createItemOptions(itm, type);
        //console.log([item,type]);
        if(item && item.hasOwnProperty('entityId') && item.hasOwnProperty('id')){
            var currentItem = this.dialog.getItem([item['entityId'], item['id']]);
            var tag = this.dialog.getTagSelector().getTag({'id':item['id'], 'entityId': item['entityId']});
            if(item.hasOwnProperty('title')){
                if(currentItem)
                    currentItem.setTitle(item['title']);
                if(tag){
                    tag.setTitle(item['title']);
                    if(item.hasOwnProperty('avatar')){
                        tag.setAvatar(item['avatar']);
                    }
                    tag.render();
                }
            }
            if(item.hasOwnProperty('subtitle')){
                if(currentItem)
                    currentItem.setSubtitle(item['subtitle']);
            }
            if(item.hasOwnProperty('caption')){
                if(currentItem)
                    currentItem.setCaption(item['caption']);
            }
            if(item.hasOwnProperty('linkTitle')){
                if(currentItem)
                    currentItem.setLinkTitle(item['linkTitle']);
            }
            if(item.hasOwnProperty('link')){
                if(currentItem)
                    currentItem.setLink(item['link']);
            }
            if(item.hasOwnProperty('avatar')){
                if(currentItem)
                    currentItem.setAvatar(item['avatar']);
            }
        }
    },
    createItemOptions:function(itm, type){
        //console.log(['createItemOptions',itm, type]);
        if(type === 'auto' && this.lastEntries.hasOwnProperty('length') && this.lastEntries.length){
            type = this.lastEntries[0];
        }
        var defOptions = {
            linkTitle: 'подробнее',
            entityId: type,
            tabs: type,
            subtitle: ''
        };
        var id = null;
        if(itm.hasOwnProperty('ID')) {
            id = itm['ID'];
        }else if(itm.hasOwnProperty('id')) {
            id = itm['id'];
        }
        if(!id) return false;
        if(typeof id !== 'string') id = id.toString();
        defOptions['id'] = id;
        defOptions['link'] = '#'+type+'||'+id;
        var caption = this.getEntityParam(type, 'caption');
        if(!caption) caption = 'элемент';
        defOptions['caption'] = id+' '+caption;

        var title = null;
        if(itm.hasOwnProperty('TITLE') && itm['TITLE']){
            title = itm['TITLE'];
        }else if(itm.hasOwnProperty('title') && itm['title']){
            title = itm['title'];
        }else if(itm.hasOwnProperty('NAME') && itm['NAME']){
            title = itm['NAME'];
            if(itm.hasOwnProperty('LAST_NAME') && itm['LAST_NAME']){
                title += ' '+itm['LAST_NAME'];
            }
        }else if(itm.hasOwnProperty('name') && itm['name']){
            title = itm['name'];
            if(itm.hasOwnProperty('lastName') && itm['lastName']){
                title += ' '+itm['lastName'];
            }
        }
        if(!title) title = 'ID: '+id;
        defOptions['title'] = title;

        if(itm.hasOwnProperty('DATE_CREATE') && itm['DATE_CREATE']){
            defOptions['subtitle'] = this.format('date',itm['DATE_CREATE']);
        }else if(itm.hasOwnProperty('createdTime') && itm['createdTime']){
            defOptions['subtitle'] = this.format('date',itm['createdTime']);
        }
        if(itm.hasOwnProperty('CATALOG_QUANTITY')){
            defOptions['subtitle'] += ' '+parceInt(itm)+'шт.'
        }
        //'OPPORTUNITY','CURRENCY_ID'
        if(itm.hasOwnProperty('OPPORTUNITY') && itm['OPPORTUNITY'] &&
            itm.hasOwnProperty('CURRENCY_ID') && itm['CURRENCY_ID']){
            defOptions['subtitle'] += ' '+this.format('currency',itm['OPPORTUNITY']+'|'+itm['CURRENCY_ID']);
        }
        if(itm.hasOwnProperty('PRICE') && itm['PRICE'] &&
            itm.hasOwnProperty('CURRENCY_ID') && itm['CURRENCY_ID']){
            defOptions['subtitle'] += ' '+this.format('currency',itm['PRICE']+'|'+itm['CURRENCY_ID']);
        }
        if(itm.hasOwnProperty('opportunity') && itm['opportunity'] &&
            itm.hasOwnProperty('currencyId') && itm['currencyId']){
            defOptions['subtitle'] += ' '+this.format('currency',itm['opportunity']+'|'+itm['currencyId']);
        }
        if(itm.hasOwnProperty('subtitle') && itm['subtitle']){
            defOptions['subtitle'] = itm['subtitle'];
        }
        defOptions['customData'] = {};
        if(['awz_employee','awz_user'].indexOf(type)>-1){
            //PERSONAL_PROFESSION
            defOptions['subtitle'] = '';
            if(itm.hasOwnProperty('PERSONAL_PROFESSION') && itm['PERSONAL_PROFESSION']){
                defOptions['subtitle'] = itm['PERSONAL_PROFESSION'];
            }
            if(itm.hasOwnProperty('PERSONAL_PHOTO') && itm['PERSONAL_PHOTO']){
                defOptions['avatar'] = itm['PERSONAL_PHOTO'];
            }else{
                defOptions['avatar'] = '/bitrix/js/ui/icons/b24/images/ui-user.svg';
            }
            defOptions['customData']['image'] = defOptions['avatar'];
        }
        if(['group','awz_group'].indexOf(type)>-1){
            if(itm.hasOwnProperty('IMAGE') && itm['IMAGE']){
                defOptions['avatar'] = itm['IMAGE'];
            }else{
                defOptions['avatar'] = '/bitrix/js/ui/icons/b24/images/ui-user-group.svg';
            }
            defOptions['customData']['image'] = defOptions['avatar'];
        }
        if(itm.hasOwnProperty('image') && itm['image']){
            defOptions['avatar'] = itm['image'];
            defOptions['customData']['image'] = defOptions['avatar'];
        }

        return defOptions;
    },
    loadPreSelectedItems: function(items){
        var k;
        var batchIds = {};
        var batchCaller = {};
        for(k in items){
            var itm = items[k];
            if(!batchIds.hasOwnProperty(itm['entityId'])){
                batchIds[itm['entityId']] = [];
            }
            batchIds[itm['entityId']].push(itm['id']);
        }
        var batch_start = false;
        for(k in batchIds){
            var method = this.getMethodList(k);
            var method_params = this.getEntityParam(k, 'm_list_params');
            if(method && method_params){

                var batch_dissable = this.getEntityParam(k, 'batch_dissable');
                if(batch_dissable){
                    try{
                        var tmp_method = this.getEntityParam(k,'url') ? [this.getEntityParam(k,'url'), method] : method;
                        eval("var tmp_params = "+method_params.replace('#IDS#','["'+batchIds[k].join('","')+'"]')+";");
                        window.awz_helper.callApi(tmp_method, tmp_params, function(res){
                            try{
                                var k2;
                                var listKey = window.AwzBx24EntityLoader_ob.getEntityParam(k, 'list_key');
                                var itr = null;
                                var row = res['result'];
                                if(listKey){
                                    itr = row[listKey];
                                }else{
                                    itr = row;
                                }
                                if(itr){
                                    for(k2 in itr){
                                        var itm = itr[k2];
                                        window.AwzBx24EntityLoader_ob.replaceItemFromItm(itm, k);
                                    }
                                }

                            }catch (e) {

                            }
                        });
                    }catch (e) {
                        console.log(e);
                    }
                }else{
                    if(!batchCaller.hasOwnProperty(k)){
                        batchCaller[k] = {};
                    }
                    try{
                        batchCaller[k]['method'] = method;
                        eval("batchCaller[k]['params'] = "+method_params.replace('#IDS#','["'+batchIds[k].join('","')+'"]')+";");
                        batch_start = true;
                    }catch (e) {
                        delete batchCaller[k];
                        console.log(e);
                    }
                }
            }
        }
        if(batch_start){
            window.AwzBx24Proxy.callBatch(batchCaller, function(result){
                //console.log(result);
                if(window.awz_helper && window.awz_helper.hasOwnProperty('addBxTime')){
                    window.awz_helper.addBxTime(result);
                }
                try{
                    var k;
                    for(k in result){
                        var row = result[k];
                        var listKey = window.AwzBx24EntityLoader_ob.getEntityParam(k, 'list_key');
                        var k2;
                        var itr = null;
                        if(row.hasOwnProperty('answer') && row['answer'].hasOwnProperty('result')){
                            if(listKey){
                                itr = row['answer']['result'][listKey];
                            }else{
                                itr = row['answer']['result'];
                            }
                        }else if(!listKey && row.hasOwnProperty('length')){
                            itr = row;
                        }else if(listKey && row.hasOwnProperty(listKey) && row[listKey].hasOwnProperty('length')){
                            itr = row[listKey];
                        }
                        if(itr){
                            for(k2 in itr){
                                var itm = itr[k2];
                                window.AwzBx24EntityLoader_ob.replaceItemFromItm(itm, k);
                            }
                        }
                    }
                }catch (e) {
                    console.log(e);
                }
            });
        }
    },
    setInputValuesFromItems: function(items){

        if(!items){
            items = this.dialog.getSelectedItems();
        }

        var add_short = false;
        if(this.lastEntries.length>1){
            add_short = true;
        }
        var values = [];
        var k;
        for(k in items){
            var itm = items[k];
            var short_code = this.getEntityParam(itm.getEntityId(),'short');
            if(add_short && short_code){
                values.push(this.getEntityParam(itm.getEntityId(),'short')+'_'+itm.getId());
            }else{
                values.push(itm.getId());
            }
        }
        $(this.dialog.getTargetNode()).find('input').val(values.join(','));
    },
    showDialog: function(entries, nodeId, multiple){
        if(!entries.hasOwnProperty('length')) return false;
        if(!entries.length) return false;
        if(!this.lastQueryTime) this.lastQueryTime = new Date().getTime() + 500;
        /* not destroyed dialog */
        if(this.dialog) {
            try{
                this.dialog.destroy();
            }catch (e) {

            }
            this.reloadDialog();
            return this.showDialog(entries, nodeId, multiple);
        }
        this.lastEntries = [];
        var parent = this;
        var tabs = [];
        var k;
        for(k in entries){
            var entity = this.getEntityParam(entries[k], 'type');
            if(entity){
                tabs.push({
                    id: entity,
                    title: this.getEntityParam(entity, ['tab','caption']),
                    itemMaxDepth:10,
                    hovered: true
                });
                this.lastEntries.push(entity);
            }
        }

        var startSelected = this.getCurrentElements('#'+nodeId+' input');

        if(!tabs.length) {
            alert('Описание сущности '+entries[0]+' не найдено');
            return false;
        }
        this.dialog = new BX.UI.EntitySelector.Dialog({
            targetNode: document.getElementById(nodeId),
            tabs:tabs,
            cacheable: false,
            enableSearch: true,
            dropdownMode: true,
            clearSearchOnSelect: false,
            focusOnFirst: false,
            selectedItems: startSelected,
            multiple: multiple,
            tagSelectorOptions: {
                placeholder: 'текст + Enter',
                events: {
                    onEnter: function(e){
                        e.preventDefault();
                        window.AwzBx24EntityLoader_ob.search();
                    },
                }
            },
            events: {
                'Item:onSelect':function(e){
                    parent.setInputValuesFromItems();
                },
                'Item:onDeselect':function(e){
                    parent.setInputValuesFromItems();
                },
                'ItemNode:onLinkClick': function(e){
                    var dt = e.getData();
                    var item = dt['node']['item'];
                    dt['event'].preventDefault();
                    var link = item.getLink();
                    //console.log(link);
                    if(link.indexOf('#')>-1 && link.indexOf('||')>-1){
                        try{
                            var parce_href = link.replace('#','');
                            var parce_href_ob = parce_href.split('||');
                            var path = window.AwzBx24Proxy.createPath(parce_href_ob[0], parce_href_ob[1]);
                            window.AwzBx24Proxy.openPath(path);
                        }catch (e) {
                            console.log(e);
                        }
                    }else{
                        window.AwzBx24Proxy.openPath(link);
                    }
                    //var path = window.AwzBx24Proxy.createPath(item.getEntityId(), item.getId());
                    //window.AwzBx24Proxy.openPath(path);
                },
                'Tab:onSelect': function(e){

                    if(parent.searchTimeouts){
                        clearInterval(parent.searchTimeouts);
                        parent.searchTimeouts = null;
                    }

                    var tab = e.getData();
                    parent.lastTab = tab['tab'].getId();
                    if(parent.lastQuery){
                        parent.search(entries);
                    }
                },
                onDestroy: function(){
                    parent.reloadDialog();
                },
                onBeforeSearch: function(e){
                    e.preventDefault();
                },
                onFirstShow: function(e){
                    try{
                        var dialog = e.getTarget();
                        var selItems = dialog.getSelectedItems();
                        parent.loadPreSelectedItems(selItems);
                    }catch (e) {
                        console.log(e);
                    }
                }
            }
        });
        this.dialog.show();
        this.dialog.selectFirstTab();
        this.lastTab = this.dialog.getActiveTab().getId();
        this.setQueryFooter();
    },
    initHandlers: function(){
        window.AwzBx24EntityLoader_ob = this;
        $(document).on('click','a.ui-tag-selector-tag-content', function(e){
            if($(this).attr('href').indexOf('#')>-1 && $(this).attr('href').indexOf('||')>-1){
                e.preventDefault();
                try{
                    var parce_href = $(this).attr('href').replace('#','');
                    var parce_href_ob = parce_href.split('||');
                    var path = window.AwzBx24Proxy.createPath(parce_href_ob[0], parce_href_ob[1]);
                    window.AwzBx24Proxy.openPath(path);
                }catch (e) {
                    console.log(e);
                }
            }
        });
    },
    init: function(){
        this.initHandlers();
        //this.loadDynamicCrm();
    }
}
window.AwzBx24Proxy = {
    createPath: function(ent, id){
        try{
            var prepareProviders = window.AwzBx24EntityLoader_ob.getLink(ent, id);
            if(prepareProviders) return prepareProviders;
        }catch (e) {
            console.log(e);
        }
        if(ent === 'placement'){
            return id;
        }
        if(ent === 'app'){
            return '/marketplace/view/'+window.awz_helper.MARKET_ID+'/'+id;
        }
        if(typeof id !== 'string') id = id.toString();
        if (ent === 'auto'){
            var tmp = id.replace(/([\d\+])/g,'');
            if(tmp == 'C_') ent = 'contact';
            if(tmp == 'CO_') ent = 'company';
            if(tmp == 'D_') ent = 'deal';
            if(tmp == 'L_') ent = 'lead';
            if(tmp == 'SI_') ent = 'smart_invoice';
            if(tmp == 'Q_') ent = 'quote';
            if(id.charAt(0) === 'T') {
                var tmp2 = id.split('_');
                ent = parseInt(tmp2[0].replace(/^T/g,''), 16);
                id = tmp2[1];
            }
        }
        if(ent === 'COMPANY') ent = 'company';
        if(ent === 'CONTACT') ent = 'contact';
        if(ent === 'DEAL') ent = 'deal';
        if(ent === 'LEAD') ent = 'lead';
        if(ent === 'EXT_COMPANY') ent = 'company';
        if(ent === 'EXT_CONTACT') ent = 'contact';
        if(ent === 'EXT_DEAL') ent = 'deal';
        if(ent === 'employee') ent = 'user';
        if(ent === 'awz_employee') ent = 'user';
        if(ent === 'awz_user') ent = 'user';
        var path = '';
        if(ent.indexOf('s_catalog_')>-1){
            path = '/crm/catalog/section/'+id+'/?IBLOCK_ID='+ent.replace('s_catalog_','')+'&type=CRM_PRODUCT_CATALOG&lang=ru&ID='+id+'&find_section_section=0';
        }else if(ent.indexOf('catalog_')>-1){
            path = '/crm/catalog/'+ent.replace('catalog_','')+'/product/'+id+'/';
        }else if(ent.indexOf('bitrix_processes_')>-1){
            path = '/bizproc/processes/'+ent.replace('bitrix_processes_','')+'/element/0/'+id+'/';
        }else if(ent.indexOf('list_')>-1){
            path = '/company/lists/'+ent.replace('list_','')+'/element/0/'+id+'/';
        }else if(ent.indexOf('dynamic_')>-1){
            path = '/crm/type/'+ent.replace('dynamic_','')+'/details/'+id+'/';
        }else if(ent.indexOf('DYNAMIC_')>-1){
            path = '/crm/type/'+ent.replace('DYNAMIC_','')+'/details/'+id+'/';
        }else if(ent === 'task'){
            path = '/company/personal/user/0/tasks/task/view/'+id+'/';
        }else if(ent === 'deal'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'lead'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'company'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'contact'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'quote'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'smart_invoice'){
            path = '/crm/type/31/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'user'){
            path = '/company/personal/'+ent+'/'+id+'/';
        }else if(ent === 'group'){
            path = '/workgroups/'+ent+'/'+id+'/';
        }else{
            path = '/crm/type/'+ent+'/details/'+id+'/';
            //BX24.openPath('/crm/type/'+ent+'/details/'+id+'/');
        }
        return path;
    },
    openPath: function(path){
        var dsbl_ext = false;
        if(path == '/marketplace/detail/awz.smartbag/') dsbl_ext = true;
        if(!dsbl_ext && window.awz_helper.hasOwnProperty('extUrl')){
            var path_ext = window.awz_helper.extUrl.replace(/(.*?)\/rest\/.*/g,"$1") + path;
            $('body').append('<div style="z-index:2000!important;" class="awz-ext-window-bg"><div class="awz-ext-window"><h4>Переход на внешний портал</h4><div class="buttons">' +
                '<a href="#" class="close ui-btn ui-btn-xs ui-btn-danger">закрыть окно</a>'+
                '<a href="'+path_ext+'" target="_blank" class="close_ext ui-btn ui-btn-xs">перейти</a>'+
                '</div></div></div>');
        }else{
            BX24.openPath(path, function(e){
                if(e.hasOwnProperty('errorCode') && e['errorCode'] == 'PATH_NOT_AVAILABLE'){
                    $('body').append('<div style="z-index:2000!important;" class="awz-ext-window-bg"><div class="awz-ext-window"><h4>Отктытие в слайдере невозможно</h4><div class="buttons">' +
                        '<a href="#" class="close ui-btn ui-btn-xs ui-btn-danger">закрыть окно</a>'+
                        '<a href="https://' + BX24.getDomain() +path+'" target="_blank" class="close_ext ui-btn ui-btn-xs">перейти на страницу элемента</a>'+
                        '</div></div></div>');
                }
            });
        }
    },
    util_type: {
        isString: function(item) {
            return item === '' ? true : (item ? (typeof (item) == "string" || item instanceof String) : false);
        },
        isNotEmptyString: function(item) {
            return this.isString(item) ? item.length > 0 : false;
        },
        isBoolean: function(item) {
            return item === true || item === false;
        },
        isNumber: function(item) {
            return item === 0 ? true : (item ? (typeof (item) == "number" || item instanceof Number) : false);
        },
        isFunction: function(item) {
            return item === null ? false : (typeof (item) == "function" || item instanceof Function);
        },
        isElementNode: function(item) {
            return item && typeof (item) == "object" && "nodeType" in item && item.nodeType == 1 && item.tagName && item.tagName.toUpperCase() != 'SCRIPT' && item.tagName.toUpperCase() != 'STYLE' && item.tagName.toUpperCase() != 'LINK';
        },
        isDomNode: function(item) {
            return item && typeof (item) == "object" && "nodeType" in item;
        },
        isObject: function(item) {
            return item && (typeof (item) == "object" || item instanceof Object) ? true : false;
        },
        isArray: function(item) {
            return item && Object.prototype.toString.call(item) == "[object Array]";
        },
        isDate : function(item) {
            return item && Object.prototype.toString.call(item) == "[object Date]";
        }
    },
    prepareData: function(arData, prefix, callback)
    {
        var data = '', objects = [];
        if (window.AwzBx24Proxy.util_type.isString(arData) || arData == null)
        {
            callback.call(window.document, arData||'');
        }
        else
        {
            for(var i in arData)
            {
                if (!arData.hasOwnProperty(i))
                {
                    continue;
                }

                var name = encodeURIComponent(i);

                if(prefix)
                    name = prefix + '[' + name + ']';

                if(typeof arData[i] == 'object')
                {
                    objects.push([name,arData[i]]);
                }
                else
                {
                    if (data.length > 0)
                    {
                        data += '&';
                    }

                    data += name + '=' + encodeURIComponent(arData[i])
                }
            }

            var cnt = objects.length;
            if(cnt > 0)
            {
                var cb = function(str)
                {
                    data += (!!str ? '&' : '') + str;
                    if(--cnt <= 0)
                    {
                        callback.call(window.document, data)
                    }
                }

                var cnt1 = cnt;
                for(var i = 0; i < cnt1; i++)
                {
                    if(window.AwzBx24Proxy.util_type.isDomNode(objects[i][1]))
                    {
                        if(objects[i][1].tagName.toUpperCase() == 'INPUT' && objects[i][1].type == 'file')
                        {
                            if(fileReader.canUse())
                            {
                                fileReader(objects[i][1], (function(name){
                                    return function(result){
                                        if(window.AwzBx24Proxy.util_type.isArray(result)&&result.length>0)
                                        {
                                            cb(name + '[0]=' + encodeURIComponent(result[0]) + '&' + name + '[1]=' + encodeURIComponent(result[1]));
                                        }
                                        else
                                        {
                                            cb(name+'=');
                                        }
                                    }
                                })(objects[i][0]));
                            }
                        }
                        else if(typeof objects[i][1].value != 'undefined')
                        {
                            cb(objects[i][0] + '=' + encodeURIComponent(objects[i][1].value));
                        }
                        else
                        {
                            cb('');
                        }
                    }
                    else if(window.AwzBx24Proxy.util_type.isDate(objects[i][1]))
                    {
                        cb(objects[i][0] + '=' + encodeURIComponent(objects[i][1].toJSON()));
                    }
                    else if(window.AwzBx24Proxy.util_type.isArray(objects[i][1]) && objects[i][1].length <= 0)
                    {
                        cb(objects[i][0] + '=');
                    }
                    else
                    {
                        window.AwzBx24Proxy.prepareData(objects[i][1], objects[i][0], cb);
                    }
                }
            }
            else
            {
                callback.call(window.document, data)
            }
        }
    },
    callBatch: function(batch, callback, bHaltOnError, sendCallback){
        if(typeof callback !== 'function') callback = function(){};
        if(!sendCallback) sendCallback = function(){};

        if(window.awz_helper.hasOwnProperty('extUrl')){

            //window.awz_helper.addBxTime(result);
            var cmdData = {};
            var k;
            var cnt = 0;
            for(k in batch){
                var batch_row = batch[k];
                var query_data = '';
                window.AwzBx24Proxy.prepareData(batch_row.params, '', function(res) {
                    if(query_data === '') {
                        query_data += '?';
                    }else{
                        query_data += '&';
                    }
                    query_data +=  res;
                });
                cmdData[k] = batch_row.method+''+query_data;
                cnt += 1;
            }

            //console.log(cmdData);
            $.ajax({
                url: window.awz_helper.extUrl.replace('bxorm.api.hook.call','bxorm.api.hook.batch')+'batch',
                data: {cmd: cmdData, halt: false},
                dataType : "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (data, textStatus){
                    //console.log(data);
                    window.awz_helper.addBxTime(data);
                    if(data['result'].hasOwnProperty('result')){
                        callback(data['result']['result']);
                    }else{
                        callback(data['result']);
                    }
                    //window.awz_helper.getSmartData();
                    //console.log(data);
                },
                error: function (err){
                    callback(err);
                    //console.log(err);
                }
            });
        }else{
            BX24.callBatch(batch, callback, bHaltOnError);
        }
    },
    checkRespError:function(data){
        try{
            if(data.statusText){
                window.awz_helper.grid_ob.getParent().getLoader().hide();
                window.awz_helper.grid_ob.getParent().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': data.statusText+' '+data.status,
                    'TEXT': data.responseText
                }];
                window.awz_helper.grid_ob.getParent().messages.show();
            }
        }catch (e) {

        }
        try{
            if(data['status'] == 'error'){
                var k;
                var msgs = [];
                for(k in data['errors']){
                    msgs.push({
                        'TYPE': 'ERROR',
                        'TITLE': data['errors'][k]['code']+' '+data['status'],
                        'TEXT': data['errors'][k]['message']
                    });
                }
                try{
                    window.awz_helper.grid_ob.getParent().getLoader().hide();
                    window.awz_helper.grid_ob.getParent().arParams['MESSAGES'] = msgs;
                    window.awz_helper.grid_ob.getParent().messages.show();
                }catch (e) {
                    setTimeout(function(){
                        window.awz_helper.grid_ob.getParent().getLoader().hide();
                        window.awz_helper.grid_ob.getParent().arParams['MESSAGES'] = msgs;
                        window.awz_helper.grid_ob.getParent().messages.show();
                    },2000);
                }
            }
        }catch (e) {
            console.log(e.message);
        }
    },
    initHandlers: function(){
        $(document).on('click','.awz-ext-window .close',function(e){
            e.preventDefault();
            $('.awz-ext-window-bg').remove();
        });
        $(document).on('click','.awz-ext-window .close_ext',function(e){
            $('.awz-ext-window-bg').remove();
        });
    }
};

$(document).ready(function (){

    window.awz_helper = {
        bxTime: 0,
        cache_action: '',
        users: {},
        fields: {},
        filter_dates: {},
        APP_ID: '',
        APP_URL: '',
        key: '',
        smartId: null,
        gridId: null,
        lastOrder: {},
        lastFilter: {},
        arParams: {},
        loader_class: 'awz-main-preload',
        placements: null,
        get_preload_html: function (loader_mess) {
            if (!loader_mess) loader_mess = 'загрузка...';
            var ht = '<div class="' + this.loader_class + '">' +
                '<div class="awz-main-load">' +
                '<span>' + loader_mess + '</span>' +
                '</div>' +
                '</div>';
            return ht;
        },
        add_loader: function (el, title) {
            el.append(this.get_preload_html(title));
        },
        remove_loader: function () {
            $('.' + this.loader_class).remove();
        },
        check_ok: function (data) {
            if (typeof (data) === 'object') {
                if (data && data.hasOwnProperty('status') && data.status == 'success') {
                    return true;
                }
            }
            return false;
        },
        ok: {
            get_text: function (mess) {
                return '<div class="ui-alert ui-alert-success">' + mess + '</div>';
            }
        },
        errors: {
            get_text: function(data){
                var mess = [];
                if(typeof(data) === 'object'){
                    if(data && data.hasOwnProperty('status') && data.hasOwnProperty('errors') && data.status == 'error'){
                        var k;
                        for(k in data.errors){
                            var item = data.errors[k];
                            if(typeof(item) == 'object'){
                                if(item.hasOwnProperty('code')){
                                    mess.push(item.code+": "+item.message);
                                }
                            }else if(typeof(item) == 'string'){
                                mess.push(item);
                            }else{
                                mess.push('Ошибка');
                            }
                        }
                    }else{
                        mess.push('Ошибка');
                    }
                }else if(typeof (data) == "string"){
                    mess.push(data);
                }
                return '<div class="ui-alert ui-alert-danger">'+mess.join('; ')+'</div>';
            }
        },
        resize_width_bug: 0,
        resize: function(){
            if(!this.resize_width_bug) {
                this.resize_width_bug = $('body').width();
                BX24.fitWindow();
            }
            var h = $('body').height();
            if(h < 600) h = 600;
            BX24.resizeWindow(this.resize_width_bug, h+50);
        },
        clearTimeouts: function(){
            if(window.awz_helper.hasOwnProperty('timeouts_group_edit') && window.awz_helper.timeouts_group_edit){
                var k;
                for(k in window.awz_helper.timeouts_group_edit){
                    clearTimeout(window.awz_helper.timeouts_group_edit[k]);
                }
                window.awz_helper.timeouts_group_edit = null;
            }
            if(window.awz_helper.hasOwnProperty('intervals_preloader') && window.awz_helper.intervals_preloader){
                clearInterval(window.awz_helper.intervals_preloader);
                window.awz_helper.intervals_preloader = null;
            }
            if(window.awz_helper.hasOwnProperty('timeouts_preloader') && window.awz_helper.timeouts_preloader){
                window.awz_helper.timeouts_preloader.destroy();
                window.awz_helper.timeouts_preloader = null;
            }
            this.clearTimeoutsVariables();
        },
        clearTimeoutsVariables: function(){
            window.awz_helper.timeouts_group_edit = [];
            window.awz_helper.intervals_turn = [];
            window.awz_helper.intervals_lock = new Date();
            window.awz_helper.intervals_lock2 = new Date();
            window.awz_helper.current_group_action_batch = null;
            window.awz_helper.current_loader_cnt = null;
            window.awz_helper.intervals_start_date = new Date();
        },
        addBxTime: function(res){
            //console.log(res);
            try{
                if(res['time']['duration']){
                    this.bxTime += res['time']['duration'];
                }
            }catch (e) {

            }

            try{
                if(res['answer']['time']['duration']){
                    this.bxTime += res['answer']['time']['duration'];
                }
            }catch (e) {

            }

            try{
                var k;
                for(k in res){
                    if(res[k]['answer']['time']['duration'])
                        this.bxTime += res[k]['answer']['time']['duration'];
                }
            }catch (e) {

            }
            //bxTime
        },
        getPlacementManager: function(){
            if(!this.placements){
                window.AwzBx24EntityLoader_ob.setHookListDinamic();
                this.placements = new AwzBx24PlacementManager;
                this.placements.init({
                    'placements':[
                        {
                            'value':'CRM_LIST_TOOLBAR',
                            'title':'Кнопка возле роботов',
                            'data-code':'CRM_#1#_LIST_TOOLBAR'
                        },
                        {
                            'value':'CRM_DETAIL_TAB',
                            'title':'Верхнее меню карточки (таб)',
                            'data-code':'CRM_#1#_DETAIL_TAB'
                        },
                        {
                            'value':'CRM_DETAIL_TOOLBAR',
                            'title':'Список приложений в карточке',
                            'data-code':'CRM_#1#_DETAIL_TOOLBAR'
                        },
                        {
                            'value':'TASK_USER_LIST_TOOLBAR',
                            'title':'Кнопка возле роботов',
                            'data-code':'TASK_USER_LIST_TOOLBAR'
                        },
                        {
                            'value':'TASK_USER_CRM_CRM_DETAIL_TAB',
                            'title':'Таб в CRM сущности',
                            'data-code':'CRM_#1#_DETAIL_TAB'
                        },
                        {
                            'value':'TASK_GROUP_LIST_TOOLBAR',
                            'title':'Кнопка возле роботов в группе',
                            'data-code':'TASK_GROUP_LIST_TOOLBAR'
                        },
                        {
                            'value':'SONET_GROUP_DETAIL_TAB',
                            'title':'Закладка рабочей группы',
                            'data-code':'SONET_GROUP_DETAIL_TAB'
                        },
                        {
                            'value':'SONET_GROUP_TOOLBAR',
                            'title':'Кнопка на вкладке основное в группе',
                            'data-code':'SONET_GROUP_TOOLBAR'
                        },
                        {
                            'value':'CRM_DEAL_DOCUMENTGENERATOR_BUTTON',
                            'title':'Кнопка в документах сделки',
                            'data-code':'CRM_DEAL_DOCUMENTGENERATOR_BUTTON'
                        },
                        {
                            'value':'CRM_LEAD_DOCUMENTGENERATOR_BUTTON',
                            'title':'Кнопка в документах лида',
                            'data-code':'CRM_LEAD_DOCUMENTGENERATOR_BUTTON'
                        },
                        {
                            'value':'CRM_CONTACT_DOCUMENTGENERATOR_BUTTON',
                            'title':'Кнопка в документах контакта',
                            'data-code':'CRM_CONTACT_DOCUMENTGENERATOR_BUTTON'
                        },
                        {
                            'value':'CRM_COMPANY_DOCUMENTGENERATOR_BUTTON',
                            'title':'Кнопка в документах компании',
                            'data-code':'CRM_COMPANY_DOCUMENTGENERATOR_BUTTON'
                        },
                        {
                            'value':'REST_APP_URI',
                            'title':'Ссылка на приложение с параметрами',
                            'data-code':'REST_APP_URI'
                        },
                        {
                            'value':'REST_APP_WRAP',
                            'title':'Список встроек',
                            'data-code':'REST_APP_WRAP'
                        },
                    ],
                    'onBeforeGetList': function(option, from, to){
                        if(!from) return false;
                        if(!to) return false;
                        if(option.value === 'REST_APP_URI'){
                            return true;
                        }
                        if(from === 'APP_LINK'){
                            if(to === 'APP_LINK' && option.value === 'REST_APP_URI'){
                                return true;
                            }
                            if(to === 'APP_LINK' && option.value === 'REST_APP_WRAP'){
                                return true;
                            }
                            return false;
                        }
                        if(['TASK_USER_CRM'].indexOf(from)>-1){
                            if(['TASK_USER_CRM_CRM_DETAIL_TAB'].indexOf(option.value)>-1) {
                                return true;
                            }
                            return false;
                        }
                        if(['EXT_TASK_USER'].indexOf(to)>-1){
                            if(['TASK_USER_LIST_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                            return false;
                        }
                        if(['DOCS_CRM'].indexOf(from)>-1){
                            if(['LEAD','DEAL','CONTACT','COMPANY'].indexOf(to)>-1){
                                if(['CRM_DETAIL_TAB'].indexOf(option.value)>-1) {
                                    return true;
                                }
                                if(to === 'DEAL' && option.value === 'CRM_DEAL_DOCUMENTGENERATOR_BUTTON'){
                                    return true;
                                }
                                if(to === 'LEAD' && option.value === 'CRM_LEAD_DOCUMENTGENERATOR_BUTTON'){
                                    return true;
                                }
                                if(to === 'CONTACT' && option.value === 'CRM_CONTACT_DOCUMENTGENERATOR_BUTTON'){
                                    return true;
                                }
                                if(to === 'COMPANY' && option.value === 'CRM_COMPANY_DOCUMENTGENERATOR_BUTTON'){
                                    return true;
                                }
                            }
                            return false;
                        }
                        if(to.indexOf('DYNAMIC_')>-1){
                            if(['CRM_LIST_TOOLBAR','CRM_DETAIL_TAB','CRM_DETAIL_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }
                        if(['LEAD','DEAL','CONTACT','COMPANY'].indexOf(to)>-1){
                            if(['CRM_LIST_TOOLBAR','CRM_DETAIL_TAB','CRM_DETAIL_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }
                        if(['DOCS'].indexOf(to)>-1){
                            if(['CRM_DEAL_DOCUMENTGENERATOR_BUTTON','CRM_LEAD_DOCUMENTGENERATOR_BUTTON',
                                'CRM_CONTACT_DOCUMENTGENERATOR_BUTTON','CRM_COMPANY_DOCUMENTGENERATOR_BUTTON'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }
                        if(['TASK_USER'].indexOf(to)>-1){
                            if(['TASK_USER_LIST_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }
                        if(['TASK_GROUP'].indexOf(to)>-1){
                            if(['TASK_GROUP_LIST_TOOLBAR','SONET_GROUP_DETAIL_TAB','SONET_GROUP_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }

                        console.log([option, from, to]);
                        return false;
                    },
                    onAfterShow: function(from, to, type, name){
                        if(from === 'APP_LINK'){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && $(this).attr('value')!=='APP_LINK') $(this).remove();
                            });
                        }else{
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && $(this).attr('value')==='APP_LINK') $(this).remove();
                                if($(this).attr('value') && $(this).attr('value')==='WORKS') $(this).remove();
                            });
                        }
                        $('#placement-sett-manager-to').find('option').each(function(){
                            if($(this).attr('value') && $(this).attr('value')==='TASK_USER_CRM') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_TASK_USER') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_COMPANY') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_CONTACT') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_DEAL') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='DOCS_CRM') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='TASK_GROUPS') $(this).remove();
                        });
                        if(from === 'TASK_USER_CRM'){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && ['LEAD','DEAL','CONTACT','COMPANY'].indexOf($(this).attr('value'))>-1){

                                }else if($(this).attr('value') && $(this).attr('value').indexOf('DYNAMIC_')>-1){

                                }else if($(this).attr('value')){
                                    $(this).remove();
                                }
                            });
                        }
                        if(from === 'DOCS_CRM'){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && ['LEAD','DEAL','CONTACT','COMPANY'].indexOf($(this).attr('value'))>-1){

                                }else if($(this).attr('value')){
                                    $(this).remove();
                                }
                            });
                        }
                        if(from === 'TASK_GROUPS'){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && ['TASK_GROUP'].indexOf($(this).attr('value'))>-1){

                                }else if($(this).attr('value')){
                                    $(this).remove();
                                }
                            });
                        }
                        if(from.indexOf('EXT_TASK_USER')>-1){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && ['TASK_USER'].indexOf($(this).attr('value'))>-1){

                                }else if($(this).attr('value')){
                                    $(this).remove();
                                }
                            });
                        }
                        $('#placement-sett-manager-user').val("").parent('.ui-ctl').addClass('ui-ctl-disabled');
                    },
                    addHandler: function(from, to, type, name){
                        var group = $('#placement-sett-manager-group').val();
                        var userId = $('#placement-sett-manager-user').val();
                        if(type === 'REST_APP_URI' && from === 'APP_LINK'){
                            if(!name) name = 'CRM Сущности';
                            BX24.callMethod(
                                'placement.bind',
                                {
                                    'PLACEMENT': type,
                                    'HANDLER': window.awz_helper.APP_URL+'index.php?app='+window.awz_helper.APP_ID,
                                    'LANG_ALL': {
                                        ru : {
                                            'TITLE': name,
                                            'GROUP_NAME':group
                                        }
                                    }
                                },
                                function(res)
                                {
                                    window.awz_helper.addBxTime(res);
                                    if(res.answer.hasOwnProperty('error_description')){
                                        alert(res.answer.error_description);
                                    }else{
                                        window.awz_helper.loadHandledApp();
                                    }
                                }
                            );
                        }else{
                            if(!name) name = 'Без названия';
                            var smart = from;
                            var smart_to = to;

                            //version = 'new';
                            /*if(smart === 'DOCS') version = 'new';
                            if(smart === 'DOCS_CRM') version = 'new';
                            if(smart === 'TASK_USER') version = 'new';
                            if(smart === 'TASK_USER_CRM') version = 'new';
                            if(smart === 'TASK_GROUPS') version = 'new';
                            if(smart.indexOf('TASK_GROUP_')>-1) version = 'new';
                            if(smart.indexOf('EXT_TASK_USER_')>-1) version = 'new';*/

                            var url_code = '';
                            var placement = '';
                            var add_params = '';
                            var grid_key = 'awz_s__';
                            var url = '';
                            var hash = '';

                            url_code = 'smart';
                            if(smart === 'DOCS'){
                                url_code = 'docs';
                            }else if(smart === 'DOCS_CRM'){
                                url_code = 'docs';
                            }else if(smart === 'WORKS'){
                                url_code = 'works';
                            }else if(smart === 'COMPANY'){
                                url_code = 'cmp';
                            }else if(smart === 'CONTACT'){
                                url_code = 'cont';
                            }else if(smart === 'DEAL'){
                                url_code = 'deal';
                            }else if(smart === 'TASK_USER'){
                                url_code = 'task';
                            }else if(smart === 'TASK_USER_CRM'){
                                url_code = 'task';
                            }else if(smart === 'TASK_GROUPS'){
                                url_code = 'task';
                            }else if(smart.indexOf('TASK_GROUP_')>-1){
                                url_code = 'task';
                            }else if(smart.indexOf('EXT_TASK_USER_')>-1){
                                url_code = 'task';
                            }else if(smart.indexOf('EXT_COMPANY_')>-1){
                                url_code = 'cmp';
                            }else if(smart.indexOf('EXT_CONTACT_')>-1){
                                url_code = 'cont';
                            }else if(smart.indexOf('EXT_DEAL_')>-1){
                                url_code = 'deal';
                            }else if(smart.indexOf('EXT_AWZORM_')>-1){
                                url_code = 'orm';
                            }
                            if(smart_to === 'DOCS') smart_to = '';
                            if(type === 'REST_APP_WRAP') url_code = 'index';

                            $('#placement-sett-manager-type').find('option').each(function(){
                                if($(this).attr('value') === type){
                                    placement = $(this).attr('data-code').replace(/#1#/g, smart_to);
                                }
                            });
                            if(smart.indexOf('EXT_TASK_USER_')>-1){
                                grid_key += '1_EXT_TASK_USER__2_'+smart_to;
                            }else if(smart.indexOf('EXT_COMPANY_')>-1){
                                grid_key += '1_EXT_COMPANY__2_'+smart_to;
                            }else if(smart.indexOf('EXT_CONTACT_')>-1){
                                grid_key += '1_EXT_CONTACT__2_'+smart_to;
                            }else if(smart.indexOf('EXT_DEAL_')>-1){
                                grid_key += '1_EXT_DEAL__2_'+smart_to;
                            }else if(smart.indexOf('EXT_AWZORM_')>-1){
                                grid_key += '1_'+smart.replace(/_e_.*/g,"")+'__2_'+smart_to;
                            }else{
                                grid_key += '1_'+smart+'__2_'+smart_to;
                            }
                            if(userId){
                                grid_key += '__u_'+userId;
                            }
                            url = window.awz_helper.APP_URL+
                                url_code+
                                'n.php?plc='+window.awz_helper.placements.getPlacementCodeShort(placement, true)+
                                '&app='+
                                window.awz_helper.APP_ID;
                            var hashAr = [placement, url_code, smart, smart_to, name];
                            if(group) hashAr.push(group);
                            if(userId) hashAr.push(userId);
                            hash = md5(hashAr.join('_'));
                            grid_key += '__h_'+hash;
                            url += "&grid="+grid_key;

                            if(smart.indexOf('EXT_TASK_USER_')>-1 ||
                                smart.indexOf('EXT_COMPANY_')>-1 ||
                                smart.indexOf('EXT_CONTACT_')>-1 ||
                                smart.indexOf('EXT_DEAL_')>-1 ||
                                smart.indexOf('EXT_AWZORM_')>-1
                            ){
                                $('#placement-sett-manager-from').find('option').each(function(){
                                    if($(this).attr('value') === smart){
                                        if($(this).attr('data-code').indexOf('---')>-1){
                                            var tmpCode = $(this).attr('data-code').split('---');
                                            url += '&ext='+tmpCode[1].replace(/https:\/\//g,"");
                                        }
                                    }
                                });
                            }

                            var q_data = {
                                'url':url,
                                'domain':$('#signed_add_form').attr('data-domain'),
                                'app':$('#signed_add_form').attr('data-app'),
                                'signed':$('#signed_add_form').val(),
                                'params':{
                                    'handler':{
                                        'from':from,
                                        'to':to,
                                        'type':type,
                                        'name':name,
                                        'app': $('#signed_add_form').attr('data-app')
                                    }
                                }
                            };
                            var q_data_del = {
                                'domain':$('#signed_add_form').attr('data-domain'),
                                'app':$('#signed_add_form').attr('data-app'),
                                'signed':$('#signed_add_form').val()
                            }

                            if(['REST_APP_WRAP','REST_APP_URI'].indexOf(type)>-1){
                                window.awz_helper.generateHookUrl(q_data, q_data_del, url_code, null,
                                    function(awz_url, q_data_del){
                                        window.awz_helper.loadHandledApp();
                                    }
                                );
                            }else{
                                window.awz_helper.generateHookUrl(q_data, q_data_del, url_code, null,
                                    function(awz_url, q_data_del){
                                        BX24.callMethod(
                                            'placement.bind',
                                            {
                                                'PLACEMENT': placement,
                                                'HANDLER': awz_url,
                                                //'HANDLER': q_data['url'],
                                                'LANG_ALL': {
                                                    ru : {
                                                        'TITLE': name,
                                                        'GROUP_NAME':group
                                                    }
                                                },
                                                'USER_ID': userId
                                            },
                                            function(res)
                                            {
                                                window.awz_helper.addBxTime(res);
                                                if(res.answer.hasOwnProperty('error_description')){
                                                    window.awz_helper.deleteHook(q_data_del);
                                                    alert(res.answer.error_description);
                                                }else{
                                                    window.awz_helper.loadHandledApp();
                                                }
                                            }
                                        );
                                    }
                                );
                            }

                        }
                    },
                });
            }
            return this.placements;
        },
        generateHookUrl:function(q_data, q_data_del, url_code, placement_handler, callback){
            var url = q_data['url'];
            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.addhook',
                data: q_data,
                dataType : "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (data, textStatus){
                    try{
                        if(data['status']=='success'){
                            q_data_del['id'] = data['data']['hook']['ID'];
                            q_data_del['hash'] = data['data']['hook']['TOKEN'];
                            var awz_url = window.awz_helper.APP_URL+url_code+
                                'n.php?ID='+data['data']['hook']['ID']+'&TOKEN='+data['data']['hook']['TOKEN'];

                            if(typeof callback == 'function'){
                                callback.call(window.document, awz_url, q_data_del, placement_handler);
                            }
                        }else{
                            var k;
                            for(k in data['errors']){
                                alert('ошибка '+data['errors'][k]['code']+': '+data['errors'][k]['message']);
                            }
                        }
                    }catch (e) {
                        console.log(e.message);
                        alert('ошибка генерации веб хука на сервисе приложения');
                    }
                },
                error: function (err){

                }
            });
        },
        replaceHandler: function(old_url, placement_code){
            if('REST_APP_URI' == placement_code){
                alert('встройка не требует замены');
                return;
            }
            var q_data = {
                'url':old_url,
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val(),
                'params':{
                    'handler':{
                        'name':'',
                        'app': $('#signed_add_form').attr('data-app')
                    }
                }
            };
            var q_data_del = {
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val()
            }

            BX24.callMethod(
                'placement.get',
                {},
                function(res) {
                    window.awz_helper.addBxTime(res);
                    try {
                        if (res.answer.result.length){
                            var k;
                            for (k in res.answer.result) {
                                var placement = res.answer.result[k];
                                if(placement['handler'].indexOf('&TOKEN=')===-1 ||
                                    placement['handler'].indexOf('n.php?ID=')===-1
                                ){
                                    if(placement['handler'] === q_data['url']){
                                        console.log('pls', placement);
                                        q_data['name'] = placement['title'];
                                        var url_code = q_data['url'].replace(/.*\/([a-z]+)n\.php\?.*/, "$1");

                                        window.awz_helper.generateHookUrl(q_data, q_data_del, url_code, placement,
                                            function(awz_url, q_data_del, placement_handler){
                                                BX24.callMethod(
                                                    'placement.bind',
                                                    {
                                                        'PLACEMENT': placement_handler['placement'],
                                                        'HANDLER': awz_url,
                                                        'LANG_ALL': {
                                                            'ru' : {
                                                                'TITLE': placement_handler['langAll']['ru']['TITLE'],
                                                                'GROUP_NAME':placement_handler['langAll']['ru']['GROUP_NAME']
                                                            }
                                                        },
                                                        'USER_ID': placement_handler['userId']
                                                    },
                                                    function(res)
                                                    {
                                                        window.awz_helper.addBxTime(res);
                                                        if(res.answer.hasOwnProperty('error_description')){
                                                            window.awz_helper.deleteHook(q_data_del);
                                                            alert(res.answer.error_description);
                                                        }else{

                                                            BX24.callMethod(
                                                                'placement.unbind',
                                                                {
                                                                    'PLACEMENT': placement_handler['placement'],
                                                                    'HANDLER': placement_handler['handler']
                                                                },
                                                                function(resDel)
                                                                {
                                                                    window.awz_helper.loadHandledApp();
                                                                }
                                                            );

                                                        }
                                                    }
                                                );
                                        });

                                    }
                                }
                            }
                        }
                    } catch (e) {
                        alert('ошибка получения списка встроек');
                    }
                }
            );
        },
        updateGridParams: function(q_data, callback){
            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.updategrid',
                data: q_data,
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (data, textStatus) {
                    if(typeof callback == 'function'){
                        callback.call(window.document, data);
                    }
                }
            });
        },
        updateHookParams: function(q_data, callback){
            q_data['type'] = 'hook_params';
            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.updatehook',
                data: q_data,
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (data, textStatus) {
                    if(typeof callback == 'function'){
                        callback.call(window.document, data);
                    }
                }
            });
        },
        deleteHook: function(q_data_del, callback){
            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.deletehook',
                data: q_data_del,
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (data, textStatus) {
                    if(typeof callback == 'function'){
                        callback.call(window.document, data);
                    }
                }
            });
        },
        getGridParamsFromUrl: function(url){
            var urlOb = new URL(url);
            var opts = this.getGridParamsFromStr(urlOb.searchParams.get('grid'));
            opts['plc'] = urlOb.searchParams.get('plc');
            if(opts['plc']){
                opts['plc'] = this.placements.getPlacementCodeShort(opts['plc']);
            }
            return opts;
        },
        getGridParamsFromStr: function(grid){
            var options = {};
            if(grid){
                grid = grid.replace(/___/g," __");
                var tmp = grid.split('__');
                var k;
                for(k in tmp){
                    var param = tmp[k];
                    if(param && param.indexOf('_')){
                        var param_parse_key = param.match(/^([0-9a-z]+?)_(.*?)$/);
                        if(param_parse_key && typeof param_parse_key == 'object' && param_parse_key.length === 3){
                            options[param_parse_key[1]] = param_parse_key[2];
                        }
                    }
                }
            }
            return options;
        },
        loadHandledAppNoAdmin: function(){

            if(!window.awz_helper.hasOwnProperty('MARKET_ID')){
                window.awz_helper.MARKET_ID = 'awz.smartbag';
                BX24.callMethod('app.info', {}, function(res){
                    try{
                        window.awz_helper.MARKET_ID = res['answer']['result']['CODE'];
                    }catch (e) {

                    }
                    window.awz_helper.loadHandledAppNoAdmin();
                });
                return;
            }

            this.showStat();

            var q_data_hook = {
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val(),
                'publicmode':1,
                'parentplacement':window.awz_helper.parentPlacement,
                'grid_id':$('#grid-settings-button').attr('data-grid_id'),
                'key':$('#grid-settings-button').attr('data-key'),
                'check_active':1
            };

            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.listhook',
                data: q_data_hook,
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: false,
                success: function (hookList, textStatus) {
                    //console.log(hookList);
                    $('.appWrapPlaceList .row-items-active').html('');
                    try{
                        var k;

                        var itrSorted = [];
                        for (k in hookList['data']){
                            itrSorted.push(hookList['data'][k]);
                        }
                        itrSorted.sort(function(itm1, itm2){
                            return (itm1['SORT'] > itm2['SORT']) ? 1 : -1
                        });
                        //console.log(itrSorted);

                        for (k in itrSorted){
                            var plc = itrSorted[k];
                            if(plc.hasOwnProperty('DESC') && plc['DESC']){
                                plc['NAME'] += '<i>'+plc['DESC']+'</i>';
                            }
                            $('.appWrapPlaceList .row-items-active').append(
                                '<div class="item" style="background:'+plc['BG']+';"><a class="open-smart" data-ent="placement" href="/marketplace/view/'+window.awz_helper.MARKET_ID+'/?params[HOOK]='+plc['ID']+'">' +
                                '<div class="image"><img src="'+plc['IMAGE']+'"></div>' +
                                '<div class="name">'+plc['NAME']+'</div>' +
                                '</a></div>'
                            );
                        }
                    }catch (e) {
                        console.log(e);
                    }
                    if(!window.awz_helper.parentPlacement){
                        var helpUrl = 'https://zahalski.dev/contacts/';
                        $('.appWrapPlaceList .row-items-active').append(
                            '<div class="item"><a class="awz-handler-slide" data-page="help" href="#">' +
                            '<div class="image"><img src="/bitrix/js/ui/forms/images/quest.svg"></div>' +
                            '<div class="name">Поддержка решения</div>' +
                            '</a></div>'
                        );
                    }
                }
            });
        },
        appendNotHandledPlacement: function(allPlacements, hookExistsIds){
            try{
                var k;
                for(k in allPlacements['data']){
                    var pls = allPlacements['data'][k];
                    var sett_link = '<a href="#" data-app="'+$('#signed_add_form').attr('data-app')+'" data-domain="'+$('#signed_add_form').attr('data-domain')+'" data-signed="'+$('#signed_add_form').val()+'" data-id="'+pls['ID']+'" data-hash="'+pls['HASH']+'" data-page="sett-handler" class="awz-handler-slide-content ui-btn ui-btn-xs ui-btn-icon-setting"></a>';
                    var del_link = '<a href="#" data-type="app-placement" data-id="'+pls['ID']+'" data-hash="'+pls['HASH']+'" class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">удалить</a>';
                    if(hookExistsIds.indexOf(pls['ID'])===-1){
                        var title = 'ID: '+pls['ID'];
                        if(pls['PARAMS'].hasOwnProperty('handler') &&
                            pls['PARAMS']['handler'].hasOwnProperty('name') && pls['PARAMS']['handler']['name']){
                            title = pls['PARAMS']['handler']['name'];
                        }
                        $('.rows-smarts').append('<div class="row" style="margin-bottom:10px;">' +
                            '<div style="display:block;clear:both;width:100%;height:10px;"></div>'+
                            '<div class="col-xs-3 no-padding-l">' +
                            '<label class="main-grid-control-label">'+title+'</label>' +
                            '</div>' +
                            '<div class="col-xs-6">' +
                            '<label style="display:block;overflow:hidden;" class="main-grid-control-label">URL: '+pls['URL']+'</label>' +
                            '</div>' +
                            '<div class="col-xs-3 no-padding-r">'+del_link+ sett_link +
                            '</div>' +
                            '</div>');
                    }
                    var htDesc = '';
                    if(pls['PARAMS'].hasOwnProperty('hook') && pls['PARAMS']['hook'].hasOwnProperty('desc_admin')){
                        htDesc = pls['PARAMS']['hook']['desc_admin'];
                    }
                    $('.row-placement-'+pls['ID']+' .desc').remove();
                    $('.row-placement-'+pls['ID']).append('<div class="desc"></div>');
                    if(htDesc){
                        $('.row-placement-'+pls['ID']+' .desc').html('<div class="col-xs-12"><div class="row" style="border:none;">'+htDesc+'</div></div>');
                    }

                }
            }catch (e) {
                console.log(e);
            }
            //console.log('addpls',[allPlacements, hookExistsIds]);
        },
        parentPlacement: 0,
        loadHandledApp: function(parentPlacement){
            if(parentPlacement) this.parentPlacement = parentPlacement;
            if(!this.hasOwnProperty('pagesManager') || !this.pagesManager){
                this.pagesManager = new AwzBx24PageManager();
                this.pagesManager = this.pagesManager.init();
            }

            if(!this.autoLoadEntity){
                this.autoLoadEntity = new AwzBx24EntityLoader();
                this.autoLoadEntity.init();
            }

            this.loadHandledAppNoAdmin();

            var plcInfo = BX24.placement.info();
            var hideSett = false;
            if(plcInfo.hasOwnProperty('options') && plcInfo['options'].hasOwnProperty('HOOK')){
                hideSett = true;
            }

            if(!BX24.isAdmin() || hideSett){
                this.pagesManager.hidePages();
                if(!hideSett){
                    this.pagesManager.showMessage('<div class="ui-alert ui-alert-danger">Добавление встроек доступно только администратору портала</div>');
                }
                return;
            }

            var placementManager = this.getPlacementManager();
            placementManager.show();
            //this.replaceHandler();

            placementManager.appendFrom({
                'value':'APP_LINK',
                'title':'Приложение'
            });
            placementManager.appendTo({
                'value':'APP_LINK',
                'title':'Битрикс24'
            });

            //crm.type.list
            var findIdsSmart = [];
            var linksSmart = {
                'LEAD':{
                    'title': 'Лид'
                },
                'DEAL':{
                    'title': 'Сделка'
                },
                'CONTACT':{
                    'title': 'Контакты'
                },
                'COMPANY':{
                    'title': 'Компании'
                },
                'EXT_COMPANY':{
                    'title': 'Компании (внешние)'
                },
                'EXT_CONTACT':{
                    'title': 'Контакты (внешние)'
                },
                'EXT_DEAL':{
                    'title': 'Сделки (внешние)'
                },
                'TASK_USER':{
                    'title': 'Задачи'
                },
                'EXT_TASK_USER':{
                    'title': 'Задачи (внешние)'
                },
                'TASK_USER_CRM':{
                    'title': 'Задачи CRM сущности'
                },
                'TASK_GROUPS':{
                    'title': 'Задачи группы'
                },
                'DOCS':{
                    'title': 'Документы'
                },
                'DOCS_CRM':{
                    'title': 'Документы CRM сущности'
                },
                'TASK_GROUP':{
                    'title': 'Группа'
                },
                'WORKS':{
                    'title': 'Дела'
                },
            };

            var k;
            for(k in linksSmart){
                placementManager.appendTo({
                    'value':k,
                    'title':linksSmart[k].title
                });
            }
            var types = placementManager.getPlacementNames();

            var batch = [];

            batch.push({
                'method':'crm.type.list',
                'params':{}
            });
            batch.push({
                'method':'sonet_group.get',
                'params':{
                    'IS_ADMIN': 'Y',
                    'FILTER ':{'ACTIVE':'Y'}
                }
            });
            batch.push({
                'method':'user.option.get'
            });

            window.AwzBx24Proxy.callBatch(
                batch,
                function(res)
                {
                    window.awz_helper.addBxTime(res);

                    //console.log(res);
                    $('.rows-smarts').html('');
                    $('.rows-ext-smarts').html('');

                    var items_smart_types = [];
                    var items_groups = [];
                    var items_ext = [];
                    if(res.hasOwnProperty('length') && res.length>0 && res[0].hasOwnProperty('answer')){
                        items_smart_types = res[0].answer.result['types'];
                    }
                    if(res.hasOwnProperty('length') && res.length>1 && res[1].hasOwnProperty('answer')){
                        items_groups = res[1].answer.result;
                    }
                    if(res.hasOwnProperty('length') && res.length>1 && res[2].hasOwnProperty('answer')){
                        items_ext = res[2].answer.result;
                    }

                    try {
                        if(items_smart_types.length){
                            var k;
                            for (k in items_smart_types) {
                                var item = items_smart_types[k];
                                findIdsSmart.push(item.entityTypeId);
                                item.title = 'Смарт: '+item.title;
                                linksSmart[item.entityTypeId] = item;
                                linksSmart['DYNAMIC_'+item.entityTypeId] = item;

                                placementManager.appendFrom({
                                    'value':'DYNAMIC_'+item.entityTypeId,
                                    'title':item.title
                                });
                                placementManager.appendTo({
                                    'value':'DYNAMIC_'+item.entityTypeId,
                                    'title':item.title
                                });
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }

                    try {
                        if(items_groups.length){
                            var k;
                            for (k in items_groups) {
                                var item = items_groups[k];
                                //findIdsSmart.push(item.entityTypeId);
                                item.title = 'Задачи в группе: '+item.NAME;
                                item.entityTypeId = item.ID;
                                linksSmart['group_'+item.entityTypeId] = item;
                                linksSmart['TASK_GROUP_'+item.entityTypeId] = item;

                                placementManager.appendFrom({
                                    'value':'TASK_GROUP_'+item.entityTypeId,
                                    'title':item.title
                                });
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }

                    placementManager.appendFrom({
                        'value':'DOCS',
                        'title':linksSmart['DOCS'].title
                    });
                    placementManager.appendFrom({
                        'value':'WORKS',
                        'title':linksSmart['WORKS'].title
                    });
                    placementManager.appendFrom({
                        'value':'COMPANY',
                        'title':linksSmart['COMPANY'].title
                    });
                    placementManager.appendFrom({
                        'value':'CONTACT',
                        'title':linksSmart['CONTACT'].title
                    });
                    placementManager.appendFrom({
                        'value':'DEAL',
                        'title':linksSmart['DEAL'].title
                    });
                    placementManager.appendFrom({
                        'value':'DOCS_CRM',
                        'title':linksSmart['DOCS_CRM'].title
                    });
                    placementManager.appendFrom({
                        'value':'TASK_USER',
                        'title':linksSmart['TASK_USER'].title
                    });
                    placementManager.appendFrom({
                        'value':'TASK_GROUPS',
                        'title':linksSmart['TASK_GROUPS'].title
                    });
                    placementManager.appendFrom({
                        'value':'TASK_USER_CRM',
                        'title':linksSmart['TASK_USER_CRM'].title
                    });

                    var k_ext;
                    for(k_ext in items_ext){
                        if((k_ext.indexOf('e_')>-1 || k_ext.indexOf('entity_')>-1) && items_ext[k_ext].indexOf('---')){
                            var extItem = items_ext[k_ext].split('---');
                            if(extItem.length<2) continue;
                            var portal = extItem[1].replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            if(portal.indexOf('/bitrix/services/main/ajax.php')>-1){
                                portal = extItem[1].replace(/.*\/(.*)\/bitrix\/.*/g," - $1");
                            }
                            //console.log('portal '+portal);

                            var append = false;
                            var title = extItem[0];
                            var url_title = extItem[1].replace(/.*\/(.*\/rest\/[0-9]+\/[a-z0-9]{3}).*/g,"$1...");
                            if(extItem[0] === 'task'){
                                placementManager.appendFrom({
                                    'value':'EXT_TASK_USER_'+k_ext,
                                    'title':linksSmart['EXT_TASK_USER'].title + portal,
                                    'data-code':items_ext[k_ext]+'---'+k_ext
                                });
                                title = linksSmart['EXT_TASK_USER'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'company'){
                                placementManager.appendFrom({
                                    'value':'EXT_COMPANY_'+k_ext,
                                    'title':linksSmart['EXT_COMPANY'].title + portal,
                                    'data-code':items_ext[k_ext]+'---'+k_ext
                                });
                                title = linksSmart['EXT_COMPANY'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'contact'){
                                placementManager.appendFrom({
                                    'value':'EXT_CONTACT_'+k_ext,
                                    'title':linksSmart['EXT_CONTACT'].title + portal,
                                    'data-code':items_ext[k_ext]+'---'+k_ext
                                });
                                title = linksSmart['EXT_CONTACT'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'deal'){
                                placementManager.appendFrom({
                                    'value':'EXT_DEAL_'+k_ext,
                                    'title':linksSmart['EXT_DEAL'].title + portal,
                                    'data-code':items_ext[k_ext]+'---'+k_ext
                                });
                                title = linksSmart['EXT_DEAL'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'awzorm'){

                                $.ajax({
                                    url:  extItem[1].replace('api.hook.call', 'api.hook.methods'),
                                    data: {},
                                    dataType: "json",
                                    type: "POST",
                                    CORS: false,
                                    crossDomain: true,
                                    timeout: 180000,
                                    async: false,
                                    success: function (data, textStatus) {
                                        try{
                                            var kkl;
                                            for(kkl in data['data']['methods']){
                                                var methodItem = data['data']['methods'][kkl];
                                                if(kkl.indexOf('.')===-1){
                                                    placementManager.appendFrom({
                                                        'value':'EXT_AWZORM_'+kkl+'_'+k_ext,
                                                        'title':methodItem + portal,
                                                        'data-code':items_ext[k_ext]+'---'+k_ext+'---'+kkl
                                                    });
                                                    title = methodItem + portal;
                                                    linksSmart['EXT_AWZORM_'+kkl] = {'title':title};
                                                }
                                            }
                                        }catch (e) {

                                        }
                                        console.log(data);
                                    }
                                });
                                title = 'AWZ: ORM Api' + portal;
                                url_title = extItem[1].replace(/.*\/(.*\/bitrix\/services\/main\/ajax.php.*&key=[0-9a-zA-Z]{3}).*/g,"$1...");
                                url_title = url_title.replace('/bitrix/services/main/ajax.php?action=awz:bxorm.api.hook.','...');
                            }

                            $('.rows-ext-smarts').append('<div class="row" style="margin-bottom:10px;">' +
                                '<div class="col-xs-3 no-padding-l">' +
                                '<label class="main-grid-control-label">'+k_ext+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3">' +
                                '<label class="main-grid-control-label">'+title+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3">' +
                                '<label class="main-grid-control-label">'+url_title+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3 no-padding-r">' +
                                '<a href="#" data-handler="'+k_ext+'" class="remove_ext_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Удалить</a>' +
                                '</div>' +
                                '</div>');

                        }
                        window.awz_helper.resize();
                    }

                    var q_data_hook = {
                        'domain':$('#signed_add_form').attr('data-domain'),
                        'app':$('#signed_add_form').attr('data-app'),
                        'signed':$('#signed_add_form').val()
                    };


                    $.ajax({
                        url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.listhook',
                        data: q_data_hook,
                        dataType: "json",
                        type: "POST",
                        CORS: false,
                        crossDomain: true,
                        timeout: 180000,
                        async: false,
                        success: function (hookList, textStatus) {
                            //console.log(hookList);
                            var hookExists = [];
                            BX24.callMethod(
                                'placement.get',
                                {},
                                function(res)
                                {
                                    window.awz_helper.addBxTime(res);
                                    try {
                                        var find = false;
                                        var find_smarts_1 = [];
                                        if(res.answer.result.length){
                                            var k;
                                            for (k in res.answer.result) {
                                                var placement = res.answer.result[k];
                                                placement['bx_handler'] = '';
                                                placement['bx_handler_id'] = '';
                                                try{
                                                    if(placement['handler'].indexOf('ID=')>-1){
                                                        var handlerId = placement['handler'].match(/ID=([0-9]+)/i);
                                                        if(hookList['data'][handlerId[1]]['URL']){
                                                            placement['bx_handler'] = placement['handler'];
                                                            placement['handler'] = hookList['data'][handlerId[1]]['URL'];
                                                            hookExists.push(handlerId[1]);
                                                            placement['bx_handler_id'] = handlerId[1];
                                                        }
                                                    }
                                                }catch (e) {

                                                }

                                                //placement['handler'] =
                                                var candidate = placement['placement'].split('_');

                                                var gridParams = window.awz_helper.getGridParamsFromUrl(placement['handler']);
                                                //console.log([gridParams, candidate, placement]);

                                                var code_type = '';
                                                var code_to = '';
                                                var code = '';

                                                var old_version_handler = false;
                                                if(gridParams.hasOwnProperty('awz')){
                                                    if(gridParams.hasOwnProperty('plc') && gridParams['plc']){
                                                        code_type = gridParams['plc'];
                                                        if(code_type.indexOf('CRM_')>-1 && code_type.indexOf('_DETAIL_TAB')>-1){
                                                            code_type = 'CRM_DETAIL_TAB';
                                                        }
                                                        if(code_type.indexOf('CRM_')>-1 && code_type.indexOf('_LIST_TOOLBAR')>-1){
                                                            code_type = 'CRM_LIST_TOOLBAR';
                                                        }
                                                        if(code_type.indexOf('CRM_')>-1 && code_type.indexOf('_DETAIL_TOOLBAR')>-1){
                                                            code_type = 'CRM_DETAIL_TOOLBAR';
                                                        }
                                                        if(!types.hasOwnProperty(code_type)){
                                                            types[code_type] = code_type;
                                                        }
                                                    }
                                                    if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'DOCS'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }else{
                                                            code_to = 'DOCS';
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'DOCS_CRM'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'WORKS'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'COMPANY'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'CONTACT'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'DEAL'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'EXT_COMPANY'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'EXT_CONTACT'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'EXT_DEAL'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'TASK_USER_CRM'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'TASK_USER'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }else{
                                                            code_to = 'DOCS';
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'TASK_GROUPS'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'] === 'EXT_TASK_USER'){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'].indexOf('EXT_AWZORM_')>-1){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'].indexOf('TASK_GROUP_')>-1){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }else{
                                                            code_to = 'DOCS';
                                                        }
                                                    }else if(gridParams.hasOwnProperty('1') && gridParams['1'].indexOf('DYNAMIC_')>-1){
                                                        code = gridParams['1'];
                                                        if(gridParams.hasOwnProperty('2') && gridParams['2']){
                                                            code_to = gridParams['2'];
                                                        }else{
                                                            code_to = 'DOCS';
                                                        }
                                                    }
                                                }else if(['CRM','TASK','SONET','REST'].indexOf(candidate[0])>-1){
                                                    old_version_handler = true;

                                                    if(candidate[1] === 'DYNAMIC'){
                                                        code_to = parseInt(candidate[2]);
                                                        code_type = [candidate[0], candidate[3], candidate[4]].join("_");
                                                    }else if(candidate[1] === 'USER'){
                                                        code_to = candidate[0]+'_'+candidate[1];
                                                        code_type = [candidate[0], candidate[1], candidate[2], candidate[3]].join("_");
                                                    }else if(candidate[1] === 'GROUP'){
                                                        code_to = candidate[0]+'_'+candidate[1];
                                                        code_type = [candidate[0], candidate[1], candidate[2], candidate[3]].join("_");
                                                        if(candidate[0] == 'SONET'){
                                                            code_type = candidate.join("_");
                                                            code_to = 'TASK_GROUP';
                                                        }
                                                    }else if(['LEAD','DEAL','CONTACT','COMPANY','INVOICE'].indexOf(candidate[1])>-1) {
                                                        code_to = candidate[1];
                                                        code_type = [candidate[0], candidate[2], candidate[3]].join("_");
                                                        if (candidate[2] == 'DOCUMENTGENERATOR') {
                                                            code_to = 'DOCS';
                                                            code_type = [candidate[0], candidate[1], candidate[2], candidate[3]].join("_");
                                                        }
                                                    }
                                                    if(placement['handler'].indexOf('smartId=TASK_USER_CRM')>-1){
                                                        code = 'TASK_USER_CRM';
                                                    }else if(placement['handler'].indexOf('smartId=TASK_USER')>-1){
                                                        code = 'TASK_USER';
                                                    }else if(placement['handler'].indexOf('smartId=EXT_TASK_USER')>-1){
                                                        code = 'EXT_TASK_USER';
                                                    }else if(placement['handler'].indexOf('smartId=EXT_COMPANY')>-1){
                                                        code = 'EXT_COMPANY';
                                                    }else if(placement['handler'].indexOf('smartId=EXT_CONTACT')>-1){
                                                        code = 'EXT_CONTACT';
                                                    }else if(placement['handler'].indexOf('smartId=EXT_DEAL')>-1){
                                                        code = 'EXT_DEAL';
                                                    }else if(placement['handler'].indexOf('smartId=DOCS')>-1){
                                                        code = 'DOCS';
                                                    }else if(placement['handler'].indexOf('smartId=WORKS')>-1){
                                                        code = 'WORKS';
                                                    }else if(placement['handler'].indexOf('smartId=TASK_GROUP_')>-1){
                                                        code = 'group_'+placement['handler'].replace(/.*smartId=[A-Z]+_[A-Z]+_([0-9]+)(.*)/g, "$1");
                                                    }else{
                                                        code = placement['handler'].replace(/.*smartId=[A-Z]+_([0-9]+)(.*)/g, "$1");
                                                    }
                                                    if(candidate[0]==='REST'){
                                                        code = 'APP_LINK';
                                                        code_to = 'APP_LINK';
                                                        code_type = [candidate[0], candidate[1], candidate[2]].join("_");
                                                    }


                                                    //find_smarts_1.push(parseInt(code));
                                                }

                                                if(placement['placement'] === 'REST_APP_URI'){
                                                    if(placement['handler'].indexOf('index.php')>-1)
                                                        old_version_handler = false;
                                                    code = 'APP_LINK';
                                                    code_to = 'APP_LINK';
                                                }

                                                var item = null;
                                                var item_to = null;
                                                if(code){
                                                    item = linksSmart[code];
                                                }
                                                if(code_to){
                                                    item_to = linksSmart[code_to];
                                                }

                                                if(candidate.length && candidate[0]==='REST'){
                                                    item = {
                                                        'title':'Приложение'
                                                    };
                                                    item_to = {
                                                        'title':'Битрикс24'
                                                    };
                                                }
                                                if(code === 'EXT_TASK_USER'){
                                                    item = {
                                                        'title':linksSmart['EXT_TASK_USER'].title+' - '+placement['handler'].replace(/.*ext=(.*)\/rest\/.*/g,"$1")
                                                    };
                                                }
                                                if(code === 'EXT_COMPANY'){
                                                    item = {
                                                        'title':linksSmart['EXT_COMPANY'].title+' - '+placement['handler'].replace(/.*ext=(.*)\/rest\/.*/g,"$1")
                                                    };
                                                }
                                                if(code === 'EXT_CONTACT'){
                                                    item = {
                                                        'title':linksSmart['EXT_CONTACT'].title+' - '+placement['handler'].replace(/.*ext=(.*)\/rest\/.*/g,"$1")
                                                    };
                                                }
                                                if(code === 'EXT_DEAL'){
                                                    item = {
                                                        'title':linksSmart['EXT_DEAL'].title+' - '+placement['handler'].replace(/.*ext=(.*)\/rest\/.*/g,"$1")
                                                    };
                                                }
                                                //if(code.indexOf('EXT_AWZORM_')>-1){
                                                    //alert(code);
                                                    //item = {
                                                    //    'title':'AWZ ORM Api - '+placement['handler'].replace(/.*ext=(.*)\/bitrix\/.*/g,"$1")
                                                    //};
                                                //}
                                                //console.log([code,code_to,item,item_to]);

                                                var sett_link = '<a href="#" data-app="'+$('#signed_add_form').attr('data-app')+'" data-domain="'+$('#signed_add_form').attr('data-domain')+'" data-signed="'+$('#signed_add_form').val()+'" data-bxhandler="'+placement['bx_handler']+'" data-page="sett-handler" class="awz-handler-slide-content ui-btn ui-btn-xs ui-btn-icon-setting"></a>';
                                                var plc_link = '<a href="#" data-bxhandler="'+placement['bx_handler']+'" data-handler="'+placement['handler']+'" data-placement="'+placement['placement']+'" class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Деактивировать</a>';
                                                var regenLink = '';//replaceHandler
                                                if(!placement['bx_handler'] && placement['placement']!='REST_APP_URI'){
                                                    regenLink = '<a href="#" data-handler="'+placement['handler']+'" data-placement="'+placement['placement']+'" class="update_smart_handled ui-btn ui-btn-xs ui-btn-danger ui-btn-icon-alert">обновить URL</a>'
                                                    sett_link = '';
                                                }
                                                if(placement['placement']=='REST_APP_URI'){
                                                    sett_link = '';
                                                }

                                                if(!placement.hasOwnProperty('bx_handler_id')){
                                                    placement['bx_handler_id'] = '';
                                                }
                                                if(!item || !item_to){
                                                    $('.rows-smarts').append('<div class="row row-placement-'+placement['bx_handler_id']+'" style="margin-bottom:10px;">' +
                                                        '<div class="col-xs-9 no-padding-l">' +
                                                        '<label class="main-grid-control-label">'+placement['handler']+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3 no-padding-r">' +
                                                        '<label class="main-grid-control-label">'+types[code_type]+'</label>' +
                                                        '</div>' +
                                                        '<div style="display:block;clear:both;width:100%;height:10px;"></div>'+
                                                        '<div class="col-xs-3 no-padding-l">' +
                                                        '<label class="main-grid-control-label">'+placement.title+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3">' +
                                                        '<label class="main-grid-control-label">'+placement.langAll.ru.GROUP_NAME+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3">' +
                                                        '<label class="main-grid-control-label">'+(placement.userId ? 'Для пользователя с ID '+placement.userId : 'Для всех пользователей')+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3 no-padding-r">' +(old_version_handler ? '<b style="color:red;">Устарела! Пересоздайте!</b><br>' : '')+
                                                        regenLink + plc_link + sett_link +
                                                        '</div>' +
                                                        '</div>');
                                                }else{
                                                    $('.rows-smarts').append('<div class="row row-placement-'+placement['bx_handler_id']+'" style="margin-bottom:10px;">' +
                                                        '<div class="col-xs-3 no-padding-l">' +
                                                        '<label class="main-grid-control-label">'+item.title+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3">' +
                                                        '<label class="main-grid-control-label">'+item_to.title+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3 no-padding-r">' +
                                                        '<label class="main-grid-control-label">'+types[code_type]+'</label>' +
                                                        '</div>' +
                                                        '<div style="display:block;clear:both;width:100%;height:10px;"></div>'+
                                                        '<div class="col-xs-3 no-padding-l">' +
                                                        '<label class="main-grid-control-label">'+placement.title+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3">' +
                                                        '<label class="main-grid-control-label">'+placement.langAll.ru.GROUP_NAME+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3">' +
                                                        '<label class="main-grid-control-label">'+(placement.userId ? 'Для пользователя с ID '+placement.userId : 'Для всех пользователей')+'</label>' +
                                                        '</div>' +
                                                        '<div class="col-xs-3 no-padding-r">' +(old_version_handler ? '<b style="color:red;">Устарела! Пересоздайте!</b><br>' : '')+
                                                        regenLink + plc_link + sett_link +
                                                        '</div>' +
                                                        '</div>');
                                                }
                                            }
                                        }

                                    } catch (e) {
                                        console.log(e);
                                    }
                                    window.awz_helper.appendNotHandledPlacement(hookList, hookExists);
                                    window.awz_helper.resize();
                                }
                            );

                        }
                    });



                }
            );


        },
        pagesize_total: 0,
        pagesize_next: 0,
        page_size: 10,
        autoLoadEntity: null,
        postData: function(data){
            console.log('postData',data);
            data['smartId'] = this.smartId;
            data['gridId'] = this.gridId;
            data['total'] = this.pagesize_total;
            data['next'] = this.pagesize_next;
            data['page_size'] = this.page_size;
            data['bxTime'] = this.bxTime;
            this.bxTime = 0;
            if(this.cache_action){
                data['cache_action'] = this.cache_action;
                this.cache_action = '';
            }
            var plc = BX24.placement.info();
            var PLACEMENT_OPTIONS = {'plc':''};
            try{
                if(plc.options && typeof plc.options == 'object'){
                    var k;
                    for(k in plc.options){
                        PLACEMENT_OPTIONS[k] = plc.options[k];
                    }
                }
                PLACEMENT_OPTIONS['plc'] = plc.placement;
            }catch (e) {
                console.log(e);
            }
            //console.log(JSON.stringify(PLACEMENT_OPTIONS));

            try{
                if(data.hasOwnProperty('users'))
                    delete data['users'];
                if(data.hasOwnProperty('page_size')){
                    var next_cn = 0;
                    if(data.hasOwnProperty('next')){
                        next_cn = parseInt(data['next']);
                    }
                    var active_keys = [];
                    var k = 0;
                    for(k=0;k < parseInt(data['page_size']);k+=1){
                        active_keys.push((k+next_cn) % 50);
                    }
                    if(data.hasOwnProperty('items') && data['items'].hasOwnProperty('length')){
                        var k;
                        for(k in data['items']){
                            if(active_keys.indexOf(parseInt(k))===-1){
                                data['items'][k] = [];
                            }
                        }
                    }
                    if(data.hasOwnProperty('tasks') && data['tasks'].hasOwnProperty('length')){
                        var k;
                        for(k in data['tasks']){
                            if(active_keys.indexOf(parseInt(k))===-1){
                                data['tasks'][k] = [];
                            }
                        }
                    }
                    //console.log(['active_keys',active_keys]);
                }
            }catch (e) {
                console.log(e);
            }

            //window.location.pathname + window.location.search;
            //window.location.pathname = window.location.pathname.replace('/smarts/index.php');
            //console.log([window.location.pathname, window.location.search]);

            //var urlGrid = window.location.pathname + window.location.search;

            BX.Main.gridManager.getById(this.gridId).instance.
            reloadTable('POST', {'bx_result':data, key: window.awz_helper.key, PLACEMENT_OPTIONS: JSON.stringify(PLACEMENT_OPTIONS)},function(){
                window.awz_helper.autoLoadEntity.load();
                window.awz_helper.preventSortableClick = false;
                window.awz_helper.resize();
                var loader_tmp = BX.Main.gridManager.getById(window.awz_helper.gridId).instance.getLoader();
                setTimeout(function(){
                    loader_tmp.hide();
                },1000);
            }, window.awz_helper.gridUrl);
        },
        getSmartDataFiltered: function(filter, only_filter){
            var format_filter = {};
            var k;
            console.log('start_filter',filter);
            for(k in filter){
                if(k === 'FIND') {
                    if(format_filter[k])
                        format_filter['%title'] = format_filter[k];
                    continue;
                }
                if(!filter[k]) continue;

                if(k.slice(-4) === '_str') {
                    format_filter[k.slice(0,-4)] = filter[k];
                    continue;
                }
                if(k.slice(-5) === '_from') continue;
                if(k.slice(-3) === '_to') continue;
                if(k.slice(-5) === '_days') continue;
                if(k.slice(-6) === '_month') continue;
                if(k.slice(-8) === '_quarter') continue;
                if(k.slice(-5) === '_year') continue;
                if(k.slice(-8) === '_datesel'){
                    if(['CURRENT_DAY','YESTERDAY','TOMORROW',
                        'CURRENT_WEEK','CURRENT_MONTH','CURRENT_QUARTER',
                        'LAST_7_DAYS','LAST_30_DAYS','LAST_60_DAYS','LAST_90_DAYS',
                        'LAST_WEEK','LAST_MONTH','NEXT_WEEK','NEXT_MONTH'
                    ].indexOf(filter[k])>-1
                    ) {
                        format_filter['>='+k.slice(0,-8)] = this.filter_dates[filter[k]]['>='];
                        format_filter['<='+k.slice(0,-8)] = this.filter_dates[filter[k]]['<='];
                    }else if(['PREV_DAYS'].indexOf(filter[k])>-1
                    ) {
                        format_filter['<='+k.slice(0,-8)] = this.filter_dates[filter[k]]['<='];
                        var D = new Date(this.filter_dates[filter[k]]['>=']);
                        D.setDate(D.getDate() - parseInt(filter[k.slice(0,-8)+'_days']));
                        D.setHours(D.getHours() + 3);
                        format_filter['>='+k.slice(0,-8)] = D.toISOString().replace(/(.000Z)/g,'+03:00');
                    }else if(['NEXT_DAYS'].indexOf(filter[k])>-1
                    ) {
                        var D = new Date(this.filter_dates[filter[k]]['<=']);
                        D.setDate(D.getDate() + parseInt(filter[k.slice(0,-8)+'_days']));
                        D.setHours(D.getHours() + 3);
                        format_filter['<='+k.slice(0,-8)] = D.toISOString().replace(/(.000Z)/g,'+03:00');
                        format_filter['>='+k.slice(0,-8)] = this.filter_dates[filter[k]]['>='];
                    }else if(filter[k] == 'RANGE'){
                        if(filter[k.slice(0,-8)+'_from'])
                            format_filter['>='+k.slice(0,-8)] = filter[k.slice(0,-8)+'_from'];
                        if(filter[k.slice(0,-8)+'_to'])
                            format_filter['<='+k.slice(0,-8)] = filter[k.slice(0,-8)+'_to'];
                    }else if(filter[k] == 'EXACT'){
                        if(filter[k.slice(0,-8)+'_from'])
                            format_filter[k.slice(0,-8)] = filter[k.slice(0,-8)+'_from'];
                    }else if(filter[k] == 'MONTH'){
                        if(filter[k.slice(0,-8)+'_month'] && filter[k.slice(0,-8)+'_year']){
                            var D = new Date(filter[k.slice(0,-8)+'_year'], filter[k.slice(0,-8)+'_month']-1);
                            D.setHours(D.getHours() + 3);
                            var D2 = new Date(filter[k.slice(0,-8)+'_year'], filter[k.slice(0,-8)+'_month']-1);
                            D2.setMonth(D2.getMonth() + 1);
                            D2.setHours(D2.getHours() + 3);
                            format_filter['>='+k.slice(0,-8)] = D.toISOString().replace(/(.000Z)/g,'+03:00');
                            format_filter['<'+k.slice(0,-8)] = D2.toISOString().replace(/(.000Z)/g,'+03:00');
                        }
                    }else if(filter[k] == 'QUARTER'){
                        if(filter[k.slice(0,-8)+'_quarter'] && filter[k.slice(0,-8)+'_year']){
                            filter[k.slice(0,-8)+'_month'] = 1;
                            if(filter[k.slice(0,-8)+'_quarter'] == 2) filter[k.slice(0,-8)+'_month'] = 4;
                            if(filter[k.slice(0,-8)+'_quarter'] == 3) filter[k.slice(0,-8)+'_month'] = 7;
                            if(filter[k.slice(0,-8)+'_quarter'] == 4) filter[k.slice(0,-8)+'_month'] = 10;
                            var D = new Date(filter[k.slice(0,-8)+'_year'], filter[k.slice(0,-8)+'_month']-1);
                            D.setHours(D.getHours() + 3);
                            var D2 = new Date(filter[k.slice(0,-8)+'_year'], filter[k.slice(0,-8)+'_month']-1);
                            D2.setMonth(D2.getMonth() + 3);
                            D2.setHours(D2.getHours() + 3);
                            format_filter['>='+k.slice(0,-8)] = D.toISOString().replace(/(.000Z)/g,'+03:00');
                            format_filter['<'+k.slice(0,-8)] = D2.toISOString().replace(/(.000Z)/g,'+03:00');
                        }
                    }else if(filter[k] == 'YEAR'){
                        if(filter[k.slice(0,-8)+'_year']){
                            var D = new Date(filter[k.slice(0,-8)+'_year']);
                            D.setHours(D.getHours() + 3);
                            var D2 = new Date(filter[k.slice(0,-8)+'_year']);
                            D2.setFullYear(D2.getFullYear() + 1);
                            D2.setHours(D2.getHours() + 3);
                            format_filter['>='+k.slice(0,-8)] = D.toISOString().replace(/(.000Z)/g,'+03:00');
                            format_filter['<'+k.slice(0,-8)] = D2.toISOString().replace(/(.000Z)/g,'+03:00');
                        }
                    }else if(filter[k] == 'NONE'){
                        //format_filter['!'+k.slice(0,-8)] = '';
                    }
                    continue;
                }else if(k.slice(-7) === '_numsel'){
                    if(filter[k] == 'exact'){
                        format_filter[k.slice(0,-7)] = filter[k.slice(0,-7)+'_from'];
                    }else if(filter[k] == 'more'){
                        format_filter['>'+k.slice(0,-7)] = filter[k.slice(0,-7)+'_from'];
                    }else if(filter[k] == 'less'){
                        format_filter['<'+k.slice(0,-7)] = filter[k.slice(0,-7)+'_to'];
                    }else if(filter[k] == 'range'){
                        format_filter['>='+k.slice(0,-7)] = filter[k.slice(0,-7)+'_from'];
                        format_filter['<='+k.slice(0,-7)] = filter[k.slice(0,-7)+'_to'];
                    }
                    continue;
                }else if(k.slice(-8) === '_isEmpty'){
                    if(filter[k] == 'y'){
                        format_filter[k.slice(0,-8)] = '';
                    }
                    continue;
                }else if(k.slice(-12) === '_hasAnyValue'){
                    if(filter[k] == 'y'){
                        format_filter['!'+k.slice(0,-12)] = '';
                    }
                    continue;
                }
                //console.log(typeof filter[k]);
                if(typeof filter[k] === 'object'){
                    format_filter[k] = [8,10];
                }
                format_filter[k] = filter[k];
            }
            console.log('filtered',format_filter);
            if(only_filter) return format_filter;
            return this.getSmartData(null, format_filter);
        },
        getSmartData: function(order, filter){
            this.clearTimeoutsVariables();
            var params = {
            };
            params['order'] = {};
            params['filter'] = {};
            if(order){
                params['order'][order['by']] = order['order'];
                this.lastOrder = params['order'];
            }else{
                params['order'] = this.lastOrder;
            }

            if(filter){
                params['filter'] = filter;
                this.lastFilter = params['filter'];
                window.awz_helper.pagesize_next = 0;
            }else{
                params['filter'] = this.lastFilter;
            }
            if(window.awz_helper.pagesize_next){
                params['start'] = parseInt(window.awz_helper.pagesize_next);
                params['start'] = Math.floor(params['start']/50) * 50;
            }

            //TODO откостылить
            if(!this.hasOwnProperty('firstLoaded') || !this.firstLoaded){
                this.firstLoaded = true;
                try{
                    this.filterManager = BX.Main.filterManager.getList()[0];
                    var currentPresetId = this.filterManager.getPreset().getCurrentPresetId();

                    var k;
                    var tempFields = this.filterManager.getPreset().getCurrentPresetData().FIELDS;
                    var tmp_filter = {};
                    for(k in tempFields){
                        if(tempFields[k].VALUE){
                            tmp_filter[tempFields[k].ID.replace(/field_/g,'')] = tempFields[k].VALUE;
                        }
                    }
                    var flt_ar = this.getSmartDataFiltered(tmp_filter, true);
                    var check_filtered = false;
                    for(k in flt_ar){
                        if(flt_ar[k]){
                            check_filtered = true;
                        }
                    }
                    if(currentPresetId === 'tmp_filter' && !check_filtered){
                        $('.main-ui-filter-sidebar-item').each(function(){
                            if($(this).attr('data-id') && ['tmp_filter','default_filter'].indexOf($(this).attr('data-id'))===-1){
                                currentPresetId = $(this).attr('data-id');
                                window.awz_helper.filterManager.getPreset(currentPresetId).activatePreset(currentPresetId);
                                /*window.awz_helper.filterManager.filterManager.getPreset().applyPreset(currentPresetId);
                                window.awz_helper.filterManager.getPreset().activatePreset(currentPresetId);
                                var presetName = BX.util.htmlspecialcharsback(
                                    window.awz_helper.filterManager.getPreset().getAddPresetFieldInput().value
                                );
                                window.awz_helper.filterManager.addSidebarItem(currentPresetId, presetName);
                                */
                                return false;
                            }
                        });
                    }
                    console.log('start preset filter '+ currentPresetId);
                    this.filterManager.getPreset().applyPreset(currentPresetId);
                    this.filterManager.applyFilter();
                    return false;
                }catch (e) {

                }
            }

            var plc_info = BX24.placement.info();

            //var method = 'crm.item.list';
            var method = '';
            var check_order_upper = false;
            if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                method = this.gridOptions.method_list;
                check_order_upper = true;
                if(plc_info.placement){
                    var entity_code_id = plc_info.placement.replace(/CRM_(.*)_DETAIL_TAB/g, "$1");
                    if(entity_code_id === 'DEAL'){
                        params['filter']['UF_CRM_TASK'] = 'D_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'LEAD'){
                        params['filter']['UF_CRM_TASK'] = 'L_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'CONTACT'){
                        params['filter']['UF_CRM_TASK'] = 'C_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'COMPANY'){
                        params['filter']['UF_CRM_TASK'] = 'CO_'+plc_info.options.ID;
                    }
                    if(entity_code_id.indexOf('DYNAMIC_')>-1){
                        var tmp = entity_code_id.replace(/([^0-9])/g, "");
                        params['filter']['UF_CRM_TASK'] = "T"+parseInt(tmp).toString(16)+'_'+plc_info.options.ID;
                    }
                }
            }else if(this.gridOptions.PARAM_1 === 'TASK_USER'){
                method = this.gridOptions.method_list;
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                method = this.gridOptions.method_list;
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'DOCS'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'COMPANY'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'CONTACT'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'DEAL'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'EXT_COMPANY'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'EXT_CONTACT'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'EXT_DEAL'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'WORKS'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'DOCS_CRM'){
                method = this.gridOptions.method_list;
                if(['DEAL','LEAD','CONTACT','COMPANY'].indexOf(this.gridOptions.PARAM_2)>-1 && plc_info.placement){
                    params['filter']['entityId'] = plc_info.options.ID;
                }
            }else if(this.gridOptions.PARAM_1.indexOf('TASK_GROUP_')>-1){
                method = this.gridOptions.method_list;
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                method = this.gridOptions.method_list;
                check_order_upper = true;
                params['filter']['GROUP_ID'] = plc_info.options.GROUP_ID;
            }else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                method = this.gridOptions.method_list;
                params['entityTypeId'] = this.smartId;
            }else{
                alert('неизвестная приложению сущность '+this.smartId);
                return;
            }
            if(this.hasOwnProperty('fields_select')){
                params['select'] = this.fields_select;
            }

            if(window.awz_helper.hasOwnProperty('addFilter') && typeof window.awz_helper.addFilter === 'object'){
                var fl_key;
                for(fl_key in window.awz_helper.addFilter){
                    params['filter'][fl_key] = window.awz_helper.addFilter[fl_key];
                }
            }

            var key_order = {};
            if(!!this.lastOrder){
                var tmp = Object.keys(this.lastOrder);
                key_order['by'] = tmp[0];
                key_order['order'] = this.lastOrder[tmp[0]];
            }
            if(check_order_upper && !!this.fields && !!this.lastOrder && this.fields.hasOwnProperty(key_order['by'])){
                if(this.fields[key_order['by']].hasOwnProperty('upperCase')){
                    this.lastOrder = {};
                    this.lastOrder[this.fields[key_order['by']]['upperCase']] = key_order['order'];
                    params['order'] = this.lastOrder;
                }
            }

            if(method === 'tasks.task.list' && !window.awz_helper.groups){
                window.awz_helper.callApi('sonet_group.get', {}, function(res){
                    window.AwzBx24Proxy.checkRespError(res);
                    if(!window.awz_helper.groups){
                        window.awz_helper.groups = {};
                    }
                    try{
                        var k;
                        for(k in res['result']){
                            window.awz_helper.groups[res['result'][k]['ID']] = {
                                ID: res['result'][k]['NAME'],
                                NAME: res['result'][k]['NAME']
                            };
                        }
                    }catch (e) {

                    }
                });
            }

            params['filter'] = window.awz_helper.replaceFilter(params['filter']);

            window.awz_helper.callApi(method, params, function(res){
                console.log('call_api', res);
                window.AwzBx24Proxy.checkRespError(res);
                if(typeof res == 'object'){
                    if(res.hasOwnProperty('total')){
                        window.awz_helper.pagesize_total = res.total;
                    }
                    var items_key = 'items';
                    if(window.awz_helper.hasOwnProperty('gridOptions')){
                        items_key = window.awz_helper.gridOptions['result_key'];
                    }
                    if(items_key === '-'){
                        var tmp = Object.assign({}, res.result);
                        delete res.result;
                        res = Object.assign({}, res);
                        res['result'] = {'items': tmp};
                        items_key = 'items';
                    }
                    console.log('items_key', [items_key, res]);
                    if(res.hasOwnProperty('result')){

                        if(!window.awz_helper.users)
                            window.awz_helper.users = {};
                        var users_get = [];
                        var users_data = {};
                        var user_fields = [];
                        var k;
                        for(k in window.awz_helper.fields){
                            if(window.awz_helper.fields[k]['type']==='user'){
                                user_fields.push(k);
                            }
                        }
                        //console.log(user_fields);
                        try{

                            var items = [];
                            items = res.result[items_key];

                            for(k in items){
                                var item = items[k];
                                var k2;
                                for(k2 in user_fields){
                                    if(item.hasOwnProperty(user_fields[k2]) && item[user_fields[k2]]){
                                        if(!window.awz_helper.users.hasOwnProperty(item[user_fields[k2]])){
                                            if(users_get.indexOf(item[user_fields[k2]])===-1)
                                                users_get.push(item[user_fields[k2]]);
                                        }else{
                                            users_data[item[user_fields[k2]]] = {
                                                'ID': window.awz_helper.users[item[user_fields[k2]]].ID,
                                                'NAME': window.awz_helper.users[item[user_fields[k2]]].NAME,
                                                'LAST_NAME': window.awz_helper.users[item[user_fields[k2]]].LAST_NAME,
                                                'PERSONAL_PHOTO': window.awz_helper.users[item[user_fields[k2]]].PERSONAL_PHOTO,
                                            }
                                        }
                                    }
                                }
                            }
                        }catch (e){

                        }
                        res.result['users'] = users_data;
                        if(users_get.length){
                            BX24.callMethod(
                                'user.get',
                                {
                                    'FILTER': {'ID':users_get}
                                },
                                function(res2)
                                {
                                    window.awz_helper.addBxTime(res2);
                                    var k;
                                    for(k in res2['answer']['result']) {
                                        var id_usr = res2['answer']['result'][k]['ID'];
                                        window.awz_helper.users[id_usr] = res2['answer']['result'][k];
                                        //console.log(window.awz_helper.users[id_usr]);
                                        users_data[id_usr] = {
                                            'ID': window.awz_helper.users[id_usr].ID,
                                            'NAME': window.awz_helper.users[id_usr].NAME,
                                            'LAST_NAME': window.awz_helper.users[id_usr].LAST_NAME,
                                            'PERSONAL_PHOTO': window.awz_helper.users[id_usr].PERSONAL_PHOTO,
                                        }
                                    }
                                    res.result['users'] = users_data;
                                    window.awz_helper.postData(
                                        res.result
                                    );
                                }
                            );
                        }else{
                            window.awz_helper.postData(
                                res.result
                            );
                        }

                    }
                }
            });

        },
        preventSortableClick: false,
        grid_ob: null,
        placement_el_cache: null,
        init: function(key, smartId, gridId, startSize, gridOptions){

            if(!this.hasOwnProperty('pagesManager') || !this.pagesManager){
                this.pagesManager = new AwzBx24PageManager();
                this.pagesManager = this.pagesManager.init();
            }

            if(!this.autoLoadEntity){
                this.autoLoadEntity = new AwzBx24EntityLoader();
                this.autoLoadEntity.init();
            }
            try{
                if(!this.placement_el_cache){
                    var plc_info = BX24.placement.info();
                    //console.log(plc_info);
                    var method = '';
                    if(plc_info.placement === 'CRM_DEAL_DETAIL_TAB'){
                        method = 'crm.deal.get';
                    }
                    if(plc_info.placement === 'CRM_LEAD_DETAIL_TAB'){
                        method = 'crm.lead.get';
                    }
                    if(plc_info.placement === 'CRM_COMPANY_DETAIL_TAB'){
                        method = 'crm.company.get';
                    }
                    if(plc_info.placement === 'CRM_CONTACT_DETAIL_TAB'){
                        method = 'crm.contact.get';
                    }
                    if(method){
                        window.awz_helper.callApi(
                            method,
                            {id: plc_info.options.ID},
                            function(res){
                                window.awz_helper.placement_el_cache = res.result;
                                return window.awz_helper.init_after(key, smartId, gridId, startSize, gridOptions);
                            });
                        return;
                    }
                    method = '';
                    if(plc_info.placement === 'TASK_GROUP_LIST_TOOLBAR'){
                        window.awz_helper.callApi(
                            'sonet_group.get',
                            {'FILTER': {ID: plc_info.options.GROUP_ID}},
                            function(res){
                                window.awz_helper.placement_el_cache = res.result[0];
                                return window.awz_helper.init_after(key, smartId, gridId, startSize, gridOptions);
                            });
                        return;
                    }
                    if(plc_info.placement.indexOf('CRM_DYNAMIC_')>-1 && plc_info.placement.indexOf('_DETAIL_TAB')>-1){
                        var entId = plc_info.placement.replace('CRM_DYNAMIC_','').replace('_DETAIL_TAB','');
                        window.awz_helper.callApi(
                            'crm.item.get',
                            {entityTypeId: entId, id: plc_info.options.ID},
                            function(res){
                                window.awz_helper.placement_el_cache = res.result.item;
                                return window.awz_helper.init_after(key, smartId, gridId, startSize, gridOptions);
                            });
                        return;
                    }
                }
            }catch (e) {

            }

            return this.init_after(key, smartId, gridId, startSize, gridOptions);
        },
        init_after: function(key, smartId, gridId, startSize, gridOptions){

            window.awz_helper.showFieldsLink();

            if(key) this.key = key;
            if(this.gridId) return; //inited
            if(startSize){
                this.page_size = startSize;
            }
            this.gridId = gridId;
            this.smartId = smartId;
            if(!gridOptions){
                gridOptions = {'PARAM_1':smartId};
            }
            this.gridOptions = gridOptions;
            console.log(['gridOptions',gridOptions]);

            if(!!window.awz_helper.fields){
                var k;
                for(k in window.awz_helper.fields){
                    var field = window.awz_helper.fields[k];
                    if(field.hasOwnProperty('upperCase')){
                        window.awz_helper.fields[field['upperCase']] = field;
                    }
                }
            }
            if(!window.awz_helper.grid_ob){
                var Grid = BX.Main.gridManager.getById(window.awz_helper.gridId);
                if(Grid){
                    Grid.instance.getLoader().show();
                }
            }

            /*BX.Event.EventEmitter.emit = (e,t,r) =>{
                if(t != 'oniframebeforegetvalue')
                    console.log([e,t,r]);
            };*/

            BX.Event.EventEmitter
                .subscribe('BX.Main.Filter:beforeApply', (event) => {
                    event.preventDefault();
                    var data = event.getData();
                    var values = data[2].getFilterFieldsValues();
                    window.awz_helper.getSmartDataFiltered(values);
                });
            BX.Event.EventEmitter
                .subscribe('BX.Main.Filter:apply', (event) => {
                });

            BX.Event.EventEmitter
                .subscribe('BX.Main.grid:onBeforeSort', (event) => {
                    event.preventDefault();
                    if(window.awz_helper.preventSortableClick) return;
                    window.awz_helper.preventSortableClick = true;
                    var grid = event['data'].grid;
                    var header = grid.getColumnByName(event['data']['columnName']);
                    grid.getUserOptions().setSort(header.sort_by, header.sort_order);
                    window.awz_helper.lastOrder = {};
                    window.awz_helper.lastOrder[header.sort_by] = header.sort_order;
                });

            BX.Event.EventEmitter
                .subscribe('Grid::optionsChanged', (event) => {
                    var data = event.getData();
                    var p = data[0].getSettingsWindow();
                    p.disableWait(p.getApplyButton());
                    p.getPopup().close();

                    var opts = data[0].getUserOptions().getOptions();
                    if(opts['views'][opts['current_view']]['page_size']){
                        window.awz_helper.page_size = opts['views'][opts['current_view']]['page_size'];
                    }

                    window.awz_helper.getSmartData();
                });
            BX.Event.EventEmitter
                .subscribe('Grid::thereEditedRows', (event) => {
                    window.awz_helper.resize();
                });
            BX.Event.EventEmitter
                .subscribe('Grid::noEditedRows', (event) => {
                    window.awz_helper.resize();
                    window.awz_helper.canselGroupActions();
                });
            window.awz_helper.is_resize_ = false;
            BX.Event.EventEmitter
                .subscribe('Grid::resize', (event) => {
                    window.awz_helper.resize();
                });
            //Grid::thereEditedRows

            BX.Event.EventEmitter
                .subscribe('Grid::beforeRequest', (event) => {
                    var data = event.getData();
                    //console.log(data);
                    if(!window.awz_helper.grid_ob){
                        window.awz_helper.grid_ob = data[0];
                    }
                    //var tst = window.awz_helper.grid_ob.getParent().getRows().getById(10913);
                    //if(tst)
                    /*var t = window.awz_helper.grid_ob.getParent().getData();
                    if(t.hasOwnProperty('rowById') && typeof t.rowById === 'function')
                    console.log(t.rowById(10913));
                    console.log(t.rowById);
                    */

                    if(data.length>1 && data[1].hasOwnProperty('gridId')){
                        if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('action_button_'+window.awz_helper.gridId) &&
                            data[1]['data']['action_button_'+window.awz_helper.gridId] == 'edit'
                        ){
                            data[1].cancelRequest = true;
                            window.awz_helper.editRows(data[1]['data']);
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('action_button_'+window.awz_helper.gridId) &&
                            data[1]['data']['action_button_'+window.awz_helper.gridId] == 'delete'
                        ){
                            data[1].cancelRequest = true;
                            window.awz_helper.deleteRows(data[1]['data']);
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('action_button_'+window.awz_helper.gridId) &&
                            data[1]['data']['action_button_'+window.awz_helper.gridId] == 'edit_row'
                        ){
                            data[1].cancelRequest = true;
                            data[0].parent.getLoader().hide();
                            data[0].parent.tableUnfade();
                            window.AwzBx24Proxy.openPath('/crm/type/'+window.awz_helper.smartId+'/details/'+data[1]['data']['ID']+'/?init_mode=edit');
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('action_button_'+window.awz_helper.gridId) &&
                            data[1]['data']['action_button_'+window.awz_helper.gridId] == 'copy_row'
                        ){
                            data[1].cancelRequest = true;
                            data[0].parent.getLoader().hide();
                            data[0].parent.tableUnfade();
                            window.AwzBx24Proxy.openPath('/crm/type/'+window.awz_helper.smartId+'/details/'+data[1]['data']['ID']+'/?copy=1');
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('bx_result')
                        ){
                            data[1].cancelRequest = false;
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('apply_filter')
                            && data[1]['apply_filter'] == 'Y'
                        ){
                            data[1].cancelRequest = true;
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['url'].indexOf('grid_action=showpage')>-1
                        ){
                            var matches = data[1]['url'].match(/nav-smart=page-([0-9]+)/);
                            if(matches && matches.length>1){
                                window.awz_helper.pagesize_next = parseInt(matches[1])*window.awz_helper.page_size;
                                if(window.awz_helper.pagesize_next>0) window.awz_helper.pagesize_next -= window.awz_helper.page_size;
                            }else{
                                window.awz_helper.pagesize_next = 0;
                            }
                            window.awz_helper.getSmartData();
                            data[1].cancelRequest = true;
                        }else{
                            data[1].cancelRequest = true;
                        }
                    }else{
                        data[1].cancelRequest = true;
                    }


                });
            window.awz_helper.getSmartData();

            /* edit post
            * FIELDS[2][title]:
            435646
            FIELDS[2][TEST]:
            тестовое значение
            FIELDS[4][title]:
            435646 - 2
            * */
        },
        showFieldsLink: function(){
            var ht = '<div class="adm-toolbar-panel-container"><div class="adm-toolbar-panel-flexible-space"></div><div class="adm-toolbar-panel-align-right">';
            if(window.awz_helper.placement_el_cache){
                ht += '<a href="#" class="ui-btn ui-btn-sm ui-btn-icon-info awz-open-fields"></a>';
            }
            ht += '<a href="#" class="ui-btn ui-btn-sm ui-btn-icon-add awz-open-addlink"></a>';
            ht += '</div></div>';
            $('#uiToolbarContainer').append(ht);
            $('#uiToolbarContainer').append('<div class="adm-toolbar-panel-container"><div class="adm-toolbar-panel-flexible-space"></div><a onclick="window.AwzBx24Proxy.openPath(\'/marketplace/detail/awz.smartbag/\');return false;" href="#" style="line-height:12px;" class="ui-btn ui-btn-sm ui-btn-icon-plan ui-btn-danger">Оставь бесплатный отзыв <br>для бесплатного приложения</a></div>');
        },
        showStat: function(){
            var q_data_hook = {
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val(),
                'publicmode':1,
                'parentplacement':window.awz_helper.parentPlacement
            };
            var set_grid_button = '<a href="#" id="grid-settings-button" data-parentplacement="'+q_data_hook['parentplacement']+'" data-publicmode="'+q_data_hook['publicmode']+'" data-signed="'+q_data_hook['signed']+'" data-app="'+q_data_hook['app']+'" data-domain="'+q_data_hook['domain']+'" data-grid_id="'+this.gridId+'" data-key="'+this.key+'" data-page="sett-grid" class="awz-handler-slide-content ui-btn ui-btn-xs ui-btn-icon-setting"></a>';
            if($('#stat-app').html()){
                if($('#stat-app-moved').length){
                    $('#stat-app-moved').html(set_grid_button+$('#stat-app').html());
                }else{
                    $('.main-grid').append('<div id="stat-app-moved">'+set_grid_button+$('#stat-app').html()+'</div>');
                }
            }
        },
        deleteRows: function(data, group_action, callbackDelete){
            if (typeof data['ID'] === 'string'){
                data['ID'] = [data['ID']];
            }
            if(!callbackDelete) callbackDelete = function(){};
            var batch = [];
            var k;
            for(k in data['ID']){
                if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'taskId':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'TASK_USER'){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'taskId':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'taskId':data['ID'][k]
                        }
                    });
                }else if(['DOCS','COMPANY','CONTACT','DEAL','EXT_COMPANY','EXT_CONTACT','EXT_DEAL','DOCS_CRM','WORKS'].indexOf(this.gridOptions.PARAM_1)>-1){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'id':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'id':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('TASK_GROUP_')>-1){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'taskId':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'taskId':data['ID'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                    batch.push({
                        'method':this.gridOptions.method_delete,
                        'params':{
                            'entityTypeId':this.smartId,
                            'id':data['ID'][k]
                        }
                    });
                }

            }
            if(batch.length){
                if(group_action){
                    var last = null;
                    if(batch.length>0)
                        last = batch.pop();
                    var tmp_ = function(last, batch, callbackDelete){
                        if(batch.length){
                            window.AwzBx24Proxy.callBatch(batch, function(result)
                                {
                                    callbackDelete.call(window.awz_helper, result, last ? 'first' : 'end');
                                    if(last){
                                        window.awz_helper.callApi(last['method'], last['params'], function(res){
                                            callbackDelete.call(window.awz_helper, res, 'end');
                                        });
                                    }

                                }
                            );
                        }else if(last){
                            window.awz_helper.callApi(last['method'], last['params'], function(res){
                                callbackDelete.call(window.awz_helper, res, 'end');
                            });
                        }
                    };
                    tmp_(last, batch, callbackDelete);
                }else {
                    window.AwzBx24Proxy.callBatch(batch, function (result) {
                            window.awz_helper.addBxTime(result);
                            window.awz_helper.getSmartData();
                        }
                    );
                }
            }
        },
        editRows: function(data, group_action, callbackUp){
            var batch = [];
            var k;
            if(!callbackUp) callbackUp = function(){};

            var check_delete = false;
            var delete_ob = {'ID':[]};
            for(k in data['FIELDS']){
                for(k2 in data['FIELDS'][k]) {
                    if(k2 === 'delete'){
                        check_delete = true;
                        delete_ob['ID'].push(k);
                    }
                }
            }
            if(check_delete){
                //console.log(delete_ob);
                return this.deleteRows(delete_ob, group_action, callbackUp);
            }

            var formatFields = {};
            /*for(k in data['FIELDS']){
                if(this.fields[k])
            }*/
            for(k in data['FIELDS']){
                for(k2 in data['FIELDS'][k]) {
                    //console.log(k2);
                    //console.log(data['FIELDS'][k]);
                    if(k2.indexOf('_custom')>-1) {
                        delete data['FIELDS'][k][k2];
                        continue;
                    }
                    if(!this.fields[k2]) continue;
                    //console.log(this.fields[k2]);
                    if (this.fields[k2].hasOwnProperty('isMultiple') && this.fields[k2]['isMultiple']) {
                        if (typeof data['FIELDS'][k][k2] !== 'object') {
                            var delimeter = ',';
                            data['FIELDS'][k][k2] = data['FIELDS'][k][k2].split(delimeter);
                        }
                    }
                }

                if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                    var itm = {};
                    var k2;
                    for(k2 in data['FIELDS'][k]){
                        if(!this.fields[k2]) continue;
                        itm[this.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                    }
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'taskId':k,
                            'fields':itm
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'TASK_USER'){
                    var itm = {};
                    var k2;
                    for(k2 in data['FIELDS'][k]){
                        if(!this.fields[k2]) continue;
                        itm[this.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                    }
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'taskId':k,
                            'fields':itm
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                    var itm = {};
                    var k2;
                    for(k2 in data['FIELDS'][k]){
                        if(!this.fields[k2]) continue;
                        itm[this.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                    }
                    batch.push({
                        'method':'tasks.task.update',
                        'params':{
                            'taskId':k,
                            'fields':itm
                        }
                    });
                }else if(['WORKS','COMPANY','EXT_COMPANY','CONTACT','EXT_CONTACT','DEAL','EXT_DEAL'].indexOf(this.gridOptions.PARAM_1)>-1){
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'id':k,
                            'fields':data['FIELDS'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'id':k,
                            'fields':data['FIELDS'][k]
                        }
                    });
                }else if(['DOCS','DOCS_CRM'].indexOf(this.gridOptions.PARAM_1)>-1){
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'id':k,
                            'values':data['FIELDS'][k]
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('TASK_GROUP_')>-1){
                    var itm = {};
                    var k2;
                    for(k2 in data['FIELDS'][k]){
                        if(!this.fields[k2]) continue;
                        itm[this.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                    }
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'taskId':k,
                            'fields':itm
                        }
                    });
                }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                    var itm = {};
                    var k2;
                    for(k2 in data['FIELDS'][k]){
                        if(!this.fields[k2]) continue;
                        itm[this.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                    }
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'taskId':k,
                            'fields':itm
                        }
                    });
                }else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                    batch.push({
                        'method':this.gridOptions.method_update,
                        'params':{
                            'entityTypeId':this.smartId,
                            'id':k,
                            'fields':data['FIELDS'][k]
                        }
                    });
                    //console.log(['edit', data['FIELDS'][k]]);
                }

            }
            if(batch.length){
                if(group_action){
                    var last = null;
                    if(batch.length>0)
                        last = batch.pop();
                    var tmp_ = function(last, batch, callbackUp){
                        if(batch.length){
                            window.AwzBx24Proxy.callBatch(batch, function(result)
                                {
                                    callbackUp.call(window.awz_helper, result, last ? 'first' : 'end');
                                    if(last){
                                        window.awz_helper.callApi(last['method'], last['params'], function(res){
                                            callbackUp.call(window.awz_helper, res, 'end');
                                        });
                                    }

                                }
                            );
                        }else if(last){
                            window.awz_helper.callApi(last['method'], last['params'], function(res){
                                callbackUp.call(window.awz_helper, res, 'end');
                            });
                        }
                    };
                    tmp_(last, batch, callbackUp);
                }else{
                    window.AwzBx24Proxy.callBatch(batch, function(result)
                        {
                            window.awz_helper.addBxTime(result);
                            window.awz_helper.getSmartData();
                        }
                    );
                }

            }

        },
        PARAMS: {
            DOMAIN: '',
            PROTOCOL: 1,
            APP_SID: false,
            PATH: '/rest',
            LANG: '',
            AUTH_ID: '',
            REFRESH_ID: null,
            MEMBER_ID: null,
            PLACEMENT: null,
            IS_ADMIN: false,
            AUTH_EXPIRES: 0,
            USER_OPTIONS: null,
            APP_OPTIONS: null,
            PLACEMENT_OPTIONS: null
        },
        callApi: function(method, data, cbAjax){

            if(!!window.name)
            {
                var q = window.name.split('|');
                this.PARAMS.DOMAIN = q[0].replace(/\:(80|443)$/, '');
                this.PARAMS.PROTOCOL = parseInt(q[1])||0;
                this.PARAMS.APP_SID = q[2];
            }

            this.getAuth(function(auth){
                var PARAMS = window.awz_helper.PARAMS;
                var url = '';
                if(typeof method == 'string'){
                    url = 'http'+(PARAMS.PROTOCOL?'s':'')+'://' + PARAMS.DOMAIN + PARAMS.PATH + '/' + encodeURIComponent(method) + '.json';
                }else if(typeof method == 'object' && method.hasOwnProperty('length')){
                    url = method[0]+method[1];
                }

                var query_data = 'auth=' + auth.access_token;

                window.AwzBx24Proxy.prepareData(data, '', function(res){
                    query_data += '&' + res;

                    if(window.awz_helper.hasOwnProperty('extUrl')){
                        url = url.replace(/(.*\/rest\/)(.*)/g, window.awz_helper.extUrl+"$2");
                        query_data = query_data.replace(/auth=[a-z0-9]+\&(.*?)/g, "$1");
                    }

                    $.ajax({
                        url: url,
                        data: query_data,
                        dataType : "json",
                        type: "POST",
                        CORS: false,
                        crossDomain: true,
                        timeout: 180000,
                        async: false,
                        success: function (data, textStatus){
                            if(data.hasOwnProperty('data') && data['status']==='success'){
                                data = data['data'];
                            }
                            window.awz_helper.addBxTime(data);
                            cbAjax(data);
                        },
                        error: function (err){
                            cbAjax(err);
                        }
                    });

                });

            });
        },
        getAuth: function(cb){
            var auth = BX24.getAuth();
            if(auth){
                cb(auth);
            }else{
                BX24.refreshAuth(cb);
            }
        },
        menuCustom: function(url){
            if(this.placement_el_cache){
                var k2;
                for(k2 in this.placement_el_cache){
                    url = url.replace("#"+k2+"#", this.placement_el_cache[k2]);
                }
            }
            window.AwzBx24Proxy.openPath(url);
        },
        menuNewEl: function(){
            var plc_info = BX24.placement.info();
            var crm_item_id = '';
            var cur_user_id = this.hasOwnProperty('currentUserId') ? this.currentUserId : '0';
            var cur_user_id_ext = this.hasOwnProperty('extUrl') ? this.extUrl.replace(/.*\/rest\/([0-9]+)\/.*/g, "$1") : '0';
            if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                if(plc_info.placement){
                    var entity_code_id = plc_info.placement.replace(/CRM_(.*)_DETAIL_TAB/g, "$1");
                    if(entity_code_id === 'DEAL'){
                        crm_item_id = 'D_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'LEAD'){
                        crm_item_id = 'L_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'CONTACT'){
                        crm_item_id = 'C_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'COMPANY'){
                        crm_item_id = 'CO_'+plc_info.options.ID;
                    }
                    if(entity_code_id.indexOf('DYNAMIC_')>-1){
                        var tmp = entity_code_id.replace(/([^0-9])/g, "");
                        crm_item_id = "T"+parseInt(tmp).toString(16)+'_'+plc_info.options.ID;
                    }
                }
                window.AwzBx24Proxy.openPath('/company/personal/user/'+parseInt(cur_user_id)+'/tasks/task/edit/0/?UF_CRM_TASK='+crm_item_id+'&TITLE=CRM%3A%20&TAGS=crm');
            }else if(this.gridOptions.PARAM_1 === 'TASK_USER'){
                window.AwzBx24Proxy.openPath('/company/personal/user/'+parseInt(cur_user_id)+'/tasks/task/edit/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                window.AwzBx24Proxy.openPath('/company/personal/user/'+parseInt(cur_user_id_ext)+'/tasks/task/edit/0/');
            }else if(this.gridOptions.PARAM_1.indexOf('TASK_GROUP_')>-1){
                var g_id = this.gridOptions.PARAM_1.replace(/TASK_GROUP_(.*)/,"$1");
                window.AwzBx24Proxy.openPath('/workgroups/group/'+g_id+'/tasks/task/edit/0/?SCOPE=tasks_grid&GROUP_ID='+g_id);
            }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                var g_id = plc_info.options.GROUP_ID;
                window.AwzBx24Proxy.openPath('/workgroups/group/'+g_id+'/tasks/task/edit/0/?SCOPE=tasks_grid&GROUP_ID='+g_id);
            }else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                window.AwzBx24Proxy.openPath('/crm/type/'+this.smartId+'/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'COMPANY'){
                window.AwzBx24Proxy.openPath('/crm/company/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'CONTACT'){
                window.AwzBx24Proxy.openPath('/crm/contact/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'DEAL'){
                window.AwzBx24Proxy.openPath('/crm/deal/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_COMPANY'){
                window.AwzBx24Proxy.openPath('/crm/company/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_CONTACT'){
                window.AwzBx24Proxy.openPath('/crm/contact/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_DEAL'){
                window.AwzBx24Proxy.openPath('/crm/deal/details/0/');
            }
        },
        rmCache: function(){
            this.cache_action = 'remove';
            this.getSmartData();
        },
        reloadList: function(){
            this.autoLoadEntity.clearCache();
            this.getSmartData();
        },
        replaceFilter: function(filter){
            var new_filter = {};
            var k;
            for(k in filter){
                var val = filter[k];
                try{
                    if(typeof val === 'object'){
                        var k3;
                        for(k3 in val){
                            if(val[k3].indexOf("#")>-1 && this.placement_el_cache){
                                var k2;
                                for(k2 in this.placement_el_cache){
                                    val[k3] = val[k3].replace("#"+k2+"#", this.placement_el_cache[k2]);
                                }
                            }
                        }
                    }else{
                        if(val.indexOf("#")>-1 && this.placement_el_cache){
                            var k2;
                            for(k2 in this.placement_el_cache){
                                val = val.replace("#"+k2+"#", this.placement_el_cache[k2]);
                            }
                        }
                    }
                }catch (e) {

                }

                new_filter[k] = val;
            }
            console.log(['replaceFilter', filter, new_filter]);
            return new_filter;
        },
        applyGroupButton: function(action){
            var actionId = $('#base_action_select_control').attr('data-value');
            var field_up_id = actionId.replace("control_ef_","");
            var field_type = 'update';
            if(field_up_id === 'delete')
                field_type = 'delete';
            if(field_up_id === 'copy')
                field_type = 'copy';
            var value = $('#value_entry_control').val();
            if(!value)
                value = $('#value_entry_control').attr('data-value');
            if(!value) value = '';
            var check_all = $('#apply_button_for_all_control').is(':checked');

            var values = Object.keys(this.grid_ob.getParent().getRows().getEditSelectedValues(true));
            var values_f = [];
            var k;
            for(k in values){
                if(parseInt(values[k]) > 0){
                    values_f.push(parseInt(values[k]));
                }
            }

            var max_start_cnt = window.awz_helper.pagesize_total;
            var ids_el = [];
            if(field_type === 'copy'){
                if(!value) value = 1;
                ids_el = window.awz_helper.grid_ob.getParent().getRows().getSelectedIds();
                max_start_cnt = ids_el.length * parseInt(value);
            }

            //console.log([values_f, actionId, field_up_id, value, check_all]);

            if(check_all && !window.awz_helper.pagesize_total){
                this.grid_ob.getParent().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': 'Ошибка',
                    'TEXT': 'Общее количество элементов не указано'
                }];
                this.grid_ob.getParent().messages.show();
            }else if(check_all || field_type === 'copy'){
                window.awz_helper.last_turn_id = 0;
                var started_fast = true;
                var text_before = "Обработка элементов по фильтру <a class=\"close_ids_change\" href=\"#\">отменить</a>";
                if(field_type === 'copy'){
                    text_before = "Копирование элементов <a class=\"close_ids_change\" href=\"#\">отменить</a>";
                }
                var text_api1 = "";
                var text_api2 = "";
                var text_api3 = "";
                window.awz_helper.timeouts_preloader = new BX.UI.ProgressBar({
                    textBefore: text_before,
                    size: BX.UI.ProgressBar.Size.LARGE,
                    fill: true,
                    maxValue: max_start_cnt,
                    value: 0,
                    column: true,
                    color: BX.UI.ProgressBar.Color.SUCCESS,
                    statusType: BX.UI.ProgressBar.Status.COUNTER
                });
                $('#'+window.awz_helper.gridId+'_bottom_panels .ui-progressbar').remove();
                $('#'+this.gridId+'_bottom_panels').append(window.awz_helper.timeouts_preloader.getContainer());
                window.awz_helper.resize();

                var tmp_vars = this.prepareGroupListParams();
                var batch_prepare = [];
                var method = tmp_vars[0];
                var params = tmp_vars[1];
                var check_order_upper = tmp_vars[2];
                var check_add_upper = tmp_vars[3];

                if(field_type === 'copy'){
                    params['filter'] = {};
                    params['filter'][params['select'][0]] = ids_el;
                    params['select'] = Object.keys(window.awz_helper.fields);
                }
                if(params['filter'].hasOwnProperty('>ID')) started_fast = false;
                if(params['filter'].hasOwnProperty('<ID')) started_fast = false;
                if(params['filter'].hasOwnProperty('=ID')) started_fast = false;
                if(params['filter'].hasOwnProperty('ID')) started_fast = false;
                if(params['filter'].hasOwnProperty('>id')) started_fast = false;
                if(params['filter'].hasOwnProperty('<id')) started_fast = false;
                if(params['filter'].hasOwnProperty('=id')) started_fast = false;
                if(params['filter'].hasOwnProperty('id')) started_fast = false;

                window.awz_helper.clearTimeoutsVariables();

                var step = 50;
                var max_operation = 300;
                if(field_type === 'copy'){
                    var params_copy = Object.assign({},params);
                    var ob_tmp = {'cnt': parseInt(value)};
                    window.awz_helper.intervals_turn.push([
                        method, params_copy, ob_tmp
                    ]);
                }else{
                    for(var k=0; k < (window.awz_helper.pagesize_total/step); k++){
                        var params_copy = Object.assign({},params);
                        params_copy['start'] = step*k;
                        if(started_fast){
                            params_copy['start'] = -1
                            params_copy['order'] = {};
                            params_copy['order'][params_copy['select'][0]] = 'asc';
                            params_copy['f_key'] = '>'+params_copy['select'][0];
                        }
                        var ob_tmp = {
                            'FIELDS':{}
                        };
                        ob_tmp['FIELDS'][field_up_id] = value;
                        window.awz_helper.intervals_turn.push([
                            method, params_copy,
                            ob_tmp
                        ]);
                    }
                    window.awz_helper.current_loader_cnt = [
                        0,
                        window.awz_helper.pagesize_total
                    ];
                    //console.log(window.awz_helper.intervals_turn);
                }

                window.awz_helper.intervals_preloader = setInterval(function(){
                    var diff = (new Date() - window.awz_helper.intervals_start_date) / 1000;
                    var hours = Math.floor(diff / 60 / 60);
                    var minutes = Math.floor(diff / 60) - (hours * 60);
                    var seconds = Math.floor(diff % 60);
                    text_api3 = '<br>Время работы: '+[
                        hours.toString().padStart(2, '0'),
                        minutes.toString().padStart(2, '0'),
                        seconds.toString().padStart(2, '0')
                    ].join(':');
                    var lock_time = false;
                    if(window.awz_helper.intervals_lock > new Date()){
                        var res = window.awz_helper.intervals_lock_last_res;
                        var tm = new Date(res['time']['operating_reset_at']*1000);
                        var dif_seconds = window.awz_helper.intervals_lock - new Date();
                        text_api1 = '<br>время апи list: '+Math.round(res['time']['operating']*100)/100+' из '+max_operation+
                            ', сброс лимитов: '+tm.toLocaleTimeString()+
                            ' (через '+Math.round(dif_seconds/1000)+' сек.)';
                        window.awz_helper.timeouts_preloader.setTextBefore(
                            text_before+text_api1+text_api2+text_api3
                        );
                        window.awz_helper.timeouts_preloader.update();
                        window.awz_helper.resize();
                        lock_time = true;
                    }
                    if(window.awz_helper.intervals_lock2 > new Date()){
                        var res = window.awz_helper.intervals_lock_last_res2;
                        var tm = new Date(res['time']['operating_reset_at']*1000);
                        var dif_seconds = window.awz_helper.intervals_lock2 - new Date();
                        text_api2 = '<br>время апи '+field_type+': '+Math.round(res['time']['operating']*100)/100+' из '+max_operation+
                            ', сброс лимитов: '+tm.toLocaleTimeString()+
                            ' (через '+Math.round(dif_seconds/1000)+' сек.)';
                        window.awz_helper.timeouts_preloader.setTextBefore(
                            text_before+text_api1+text_api2+text_api3
                        );
                        window.awz_helper.timeouts_preloader.update();
                        window.awz_helper.resize();
                        lock_time = true;
                    }
                    if(lock_time) return;
                    if(window.awz_helper.current_group_action_batch) {
                        return;
                    }
                    //console.log('call group_action');
                    var el = window.awz_helper.intervals_turn.pop();
                    if(!el) {
                        clearInterval(window.awz_helper.intervals_preloader);
                        window.awz_helper.intervals_preloader = null;
                        window.awz_helper.clearTimeoutsVariables();
                        window.awz_helper.reloadList();
                        return;
                    }
                    var method = el[0];
                    var prm = el[1];
                    var up_object = el[2];
                    if(up_object.hasOwnProperty('add')){
                        if(check_add_upper){
                            var converted = {};
                            for(k in window.awz_helper.temp_items[up_object['add']]){
                                if(window.awz_helper.fields.hasOwnProperty(k) && window.awz_helper.fields[k].hasOwnProperty('upperCase')){
                                    converted[window.awz_helper.fields[k].upperCase] = window.awz_helper.temp_items[up_object['add']][k];
                                }
                            }
                            prm = {'fields':converted};
                        }else{
                            prm = {'fields':window.awz_helper.temp_items[up_object['add']]};
                            if(params.hasOwnProperty('entityTypeId')){
                                prm['entityTypeId'] = params['entityTypeId'];
                            }
                        }
                        if(prm.fields.hasOwnProperty('id')){
                            delete prm.fields['id'];
                        }
                        if(prm.fields.hasOwnProperty('ID')){
                            delete prm.fields['ID'];
                        }
                    }
                    if(prm.hasOwnProperty('f_key')){
                        prm['filter'][prm['f_key']] = window.awz_helper.last_turn_id;
                        delete prm['f_key'];
                    }

                    //console.log('up_object', up_object);
                    window.awz_helper.current_group_action_batch = true;
                    if(up_object.hasOwnProperty('add')){

                        window.awz_helper.tmp_func = function(method, prm){
                            window.awz_helper.callApi(method, prm, function(bres){
                                window.AwzBx24Proxy.checkRespError(bres);
                                window.awz_helper.intervals_lock_last_res2 = bres;
                                if(bres && bres.hasOwnProperty('time')){
                                    var tm = new Date(bres['time']['operating_reset_at']*1000);
                                    if(bres['time']['operating']>max_operation){
                                        window.awz_helper.intervals_lock2 = tm;
                                    }
                                    text_api2 = '<br>время апи '+field_type+': '+Math.round(bres['time']['operating']*100)/100+' из '+max_operation+
                                        ', сброс лимитов: '+tm.toLocaleTimeString();
                                    window.awz_helper.timeouts_preloader.setTextBefore(
                                        text_before+text_api1+text_api2+text_api3
                                    );
                                }
                                if(window.awz_helper.current_loader_cnt){
                                    window.awz_helper.current_loader_cnt[0] += 1;
                                    window.awz_helper.timeouts_preloader.setMaxValue(window.awz_helper.current_loader_cnt[1]);
                                    window.awz_helper.timeouts_preloader.update(window.awz_helper.current_loader_cnt[0]);
                                }else{
                                    window.awz_helper.timeouts_preloader.update();
                                }
                                window.awz_helper.resize();
                                window.awz_helper.current_group_action_batch = false;
                            });
                        };

                        if(up_object.hasOwnProperty('batch')){
                            var bach_tmp = [];
                            var k3;
                            for(k3=0; k3<up_object['batch']; k3++){
                                bach_tmp.push({
                                    'method': method,
                                    'params': prm
                                });
                            }
                            var tmp = function(batch, cnt, method, prm){
                                window.AwzBx24Proxy.callBatch(batch, function(){
                                    window.awz_helper.current_loader_cnt[0] += cnt;
                                    window.awz_helper.timeouts_preloader.setMaxValue(window.awz_helper.current_loader_cnt[1]);
                                    window.awz_helper.timeouts_preloader.update(window.awz_helper.current_loader_cnt[0]);
                                    window.awz_helper.tmp_func(method, prm);
                                });
                            };
                            tmp(bach_tmp, up_object['batch'], method, prm);
                        }else{
                            window.awz_helper.tmp_func(method, prm);
                        }

                    }else{
                        window.awz_helper.callApi(method, prm, function(res){
                            window.awz_helper.intervals_lock_last_res = res;
                            window.AwzBx24Proxy.checkRespError(res);
                            if(res.hasOwnProperty('time')){
                                var tm = new Date(res['time']['operating_reset_at']*1000);
                                if(res['time']['operating']>max_operation){
                                    window.awz_helper.intervals_lock = tm;
                                }
                                text_api1 = '<br>время апи list: '+Math.round(res['time']['operating']*100)/100+' из '+max_operation+
                                    ', сброс лимитов: '+tm.toLocaleTimeString();
                                window.awz_helper.timeouts_preloader.setTextBefore(
                                    text_before+text_api1+text_api2+text_api3
                                );
                                window.awz_helper.timeouts_preloader.update();
                                window.awz_helper.resize();
                            }

                            var items_key = 'items';
                            if(window.awz_helper.hasOwnProperty('gridOptions')){
                                items_key = window.awz_helper.gridOptions['result_key'];
                            }
                            if(items_key === '-'){
                                var tmp = Object.assign({}, res.result);
                                delete res.result;
                                res = Object.assign({}, res);
                                res['result'] = {'items': tmp};
                                items_key = 'items';
                            }
                            if(res.hasOwnProperty('result')){
                                var items = [];
                                items = res.result[items_key];
                                window.awz_helper.temp_items = items;

                                if(up_object.hasOwnProperty('cnt')){
                                    var k;
                                    var kol;
                                    var all_cnt_el = 0;
                                    for(kol=1; kol <= up_object['cnt']; kol++) {
                                        //возможный максимум группового запроса
                                        var batch_len = up_object['cnt'] - kol;
                                        if(batch_len<2) batch_len = 2;
                                        if(batch_len>50) batch_len = 50;
                                        var max = kol+batch_len;
                                        for (k in items) {
                                            if(max <= up_object['cnt']){
                                                //будет выполнен групповой запрос +1 обычный
                                                window.awz_helper.intervals_turn.push([
                                                    window.awz_helper.gridOptions.method_add,
                                                    {
                                                        'fields': {}
                                                    },
                                                    {'add':k, 'batch': batch_len}
                                                ]);
                                                all_cnt_el += batch_len;
                                            }else{
                                                window.awz_helper.intervals_turn.push([
                                                    window.awz_helper.gridOptions.method_add,
                                                    {
                                                        'fields': {}
                                                    },
                                                    {'add':k}
                                                ]);
                                            }
                                            all_cnt_el += 1;
                                        }
                                        if(max <= up_object['cnt']){
                                            kol += batch_len;
                                        }
                                    }
                                    window.awz_helper.current_loader_cnt = [
                                        0,
                                        all_cnt_el
                                    ];
                                    //console.log('start counter', window.awz_helper.current_loader_cnt);
                                    window.awz_helper.current_group_action_batch = false;
                                }else{
                                    var filelds_up = {};
                                    var k;
                                    var filelds_up_cnt = 0;
                                    window.awz_helper.last_turn_id = 0;
                                    for(k in items){
                                        var id_el = 0;
                                        filelds_up_cnt += 1;
                                        if(items[k].hasOwnProperty('id')){
                                            filelds_up[items[k]['id']] = Object.assign({},up_object['FIELDS']);
                                            id_el = parseInt(items[k]['id']);
                                        }else if(items[k].hasOwnProperty('ID')){
                                            filelds_up[items[k]['ID']] = Object.assign({},up_object['FIELDS']);
                                            id_el = parseInt(items[k]['ID']);
                                        }
                                        if(window.awz_helper.last_turn_id < id_el)
                                            window.awz_helper.last_turn_id = id_el;
                                    }
                                    //если нет элементов по фильтру обрываем очередь
                                    if(!filelds_up_cnt){
                                        window.awz_helper.intervals_turn = [];
                                        window.awz_helper.current_group_action_batch = false;
                                        return;
                                    }
                                    if(started_fast){
                                        if(filelds_up_cnt === 50 && window.awz_helper.intervals_turn.length === 1){
                                            window.awz_helper.intervals_turn.push(window.awz_helper.intervals_turn[0]);
                                        }
                                    }
                                    up_object['FIELDS'] = filelds_up;
                                    window.awz_helper.filelds_up_cnt = filelds_up_cnt;
                                    window.awz_helper.editRows(up_object, true,
                                        function(bres, last)
                                        {
                                            window.awz_helper.intervals_lock_last_res2 = bres;
                                            //console.log(bres);
                                            if(bres && bres.hasOwnProperty('time')){
                                                var tm = new Date(bres['time']['operating_reset_at']*1000);
                                                if(bres['time']['operating']>max_operation){
                                                    window.awz_helper.intervals_lock2 = tm;
                                                }
                                                text_api2 = '<br>время апи '+field_type+': '+Math.round(bres['time']['operating']*100)/100+' из '+max_operation+
                                                    ', сброс лимитов: '+tm.toLocaleTimeString();
                                                window.awz_helper.timeouts_preloader.setTextBefore(
                                                    text_before+text_api1+text_api2+text_api3
                                                );

                                            }
                                            if(last === 'end'){
                                                if(window.awz_helper.current_loader_cnt){
                                                    window.awz_helper.current_loader_cnt[0] += window.awz_helper.filelds_up_cnt;
                                                    if(window.awz_helper.current_loader_cnt[0]>window.awz_helper.current_loader_cnt[1]){
                                                        window.awz_helper.current_loader_cnt[1] = window.awz_helper.current_loader_cnt[0];
                                                        window.awz_helper.timeouts_preloader.setMaxValue(window.awz_helper.current_loader_cnt[1]);
                                                    }
                                                    window.awz_helper.timeouts_preloader.update(window.awz_helper.current_loader_cnt[0]);
                                                }else{
                                                    window.awz_helper.timeouts_preloader.update();
                                                }
                                            }

                                            window.awz_helper.timeouts_preloader.update();
                                            window.awz_helper.resize();
                                            window.awz_helper.current_group_action_batch = false;
                                        }
                                    );
                                }
                            }
                        });
                    }

                },3000);

            }else{
                var ids = window.awz_helper.grid_ob.getParent().getRows().getSelectedIds();
                var ob_tmp = {
                    'FIELDS':{}
                };
                var k;
                for(k in ids){
                    ob_tmp['FIELDS'][ids[k]] = {};
                    ob_tmp['FIELDS'][ids[k]][field_up_id] = value;
                }
                window.awz_helper.editRows(ob_tmp);
            }

        },
        applyButton: function(action, entityId, smartId){
            var param = $('#paramId_control').attr('data-value');
            var actionId = $('#base_action_select_control').attr('data-value');
            var crm_items = $('#crm_entry_control').val();
            var check_all = $('#apply_button_for_all_control').is(':checked');

            var values = Object.keys(this.grid_ob.getParent().getRows().getEditSelectedValues(true));
            var values_f = [];
            var k;
            for(k in values){
                if(parseInt(values[k]) > 0){
                    values_f.push(parseInt(values[k]));
                }
            }

            var fields = {
                'title': actionId+'|'+param
            };
            if(param){
                fields['ufCrm'+smartId+'Params'] = param.replace(/param_/,'');
            }
            if(actionId){
                fields['ufCrm'+smartId+'Controls'] = actionId.replace(/control_/,'');
            }
            if(crm_items){
                fields['ufCrm'+smartId+'Items'] = crm_items.split(',');
            }
            if(values_f.length){
                fields['ufCrm'+smartId+'Elements'] = values_f;
            }

            var send_item = function(entityId, fields, smartId){
                BX24.callMethod('crm.item.add', {
                    'entityTypeId': entityId,
                    'fields': fields
                },function(res){
                    window.awz_helper.addBxTime(res);

                    var myProgress = new BX.UI.ProgressBar({
                        textBefore: "Получение результата",
                        textAfter: "...",
                        size: BX.UI.ProgressBar.Size.LARGE,
                        fill: true,
                        maxValue: 5,
                        value: 0,
                        column: true,
                        color: BX.UI.ProgressBar.Color.SUCCESS,
                        statusType: BX.UI.ProgressBar.Status.COUNTER
                    });
                    $('#'+window.awz_helper.gridId+'_bottom_panels .ui-progressbar').remove();
                    $('#'+window.awz_helper.gridId+'_bottom_panels').append(myProgress.getContainer());
                    window.awz_helper.resize();

                    var timerResult_cnt = 0;
                    var timerResult = setTimeout(function steps(){
                        timerResult_cnt++;
                        myProgress.update(timerResult_cnt);

                        BX24.callMethod('crm.item.get', {
                            'entityTypeId': entityId,
                            'id': res['answer']['result']['item']['id']
                        },function(resUpdated){
                            window.awz_helper.addBxTime(resUpdated);
                            //console.log(resUpdated);

                            var itm = resUpdated['answer']['result']['item'];
                            if(itm['ufCrm'+smartId+'Result']){
                                myProgress.setTextAfter('<a href="#" class="open-smart" data-id="'+res['answer']['result']['item']['id']+'" data-ent="'+entityId+'">элемент</a>: '+itm['ufCrm'+smartId+'Result']);
                                myProgress.update(5);
                                clearTimeout(timerResult);
                                window.awz_helper.canselGroupActions();
                                return;
                            }
                            if(timerResult_cnt == 5){
                                myProgress.setTextAfter('<a href="#" class="open-smart" data-id="'+res['answer']['result']['item']['id']+'" data-ent="'+entityId+'">элемент</a>: результат не получен за 25 секунд');
                                myProgress.update(timerResult_cnt);
                                clearTimeout(timerResult);
                                window.awz_helper.canselGroupActions();
                                return;
                            }
                            window.awz_helper.resize();
                            setTimeout(steps, 5000);

                        });


                    },5000);

                    console.log(res);
                });
            };

            if(check_all && !window.awz_helper.pagesize_total){
                this.grid_ob.getParent().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': 'Ошибка',
                    'TEXT': 'Общее количество элементов не указано'
                }];
                this.grid_ob.getParent().messages.show();
            }else if(check_all && window.awz_helper.pagesize_total>1000){
                this.grid_ob.getParent().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': 'Ошибка',
                    'TEXT': 'Общее количество по фильтру не должно быть больше 1000'
                }];
                this.grid_ob.getParent().messages.show();
            }else if(check_all){

                var myProgress = new BX.UI.ProgressBar({
                    textBefore: "Получение элементов по фильтру <a class=\"close_ids_change\" href=\"#\">отменить</a>",
                    size: BX.UI.ProgressBar.Size.LARGE,
                    fill: true,
                    maxValue: window.awz_helper.pagesize_total,
                    value: 0,
                    column: true,
                    color: BX.UI.ProgressBar.Color.SUCCESS,
                    statusType: BX.UI.ProgressBar.Status.COUNTER
                });
                $('#'+window.awz_helper.gridId+'_bottom_panels .ui-progressbar').remove();
                $('#'+this.gridId+'_bottom_panels').append(myProgress.getContainer());
                window.awz_helper.resize();

                var tmp_vars = this.prepareGroupListParams();
                var method = tmp_vars[0];
                var params = tmp_vars[1];
                var check_order_upper = tmp_vars[2];
                var check_add_upper = tmp_vars[3];
                var batch_prepare = [];

                window.awz_helper.clearTimeoutsVariables();

                var step = 50;
                for(var k=0; k < (window.awz_helper.pagesize_total/step); k++){
                    var params_copy = Object.assign({},params);
                    params_copy['start'] = step*k;
                    batch_prepare.push({
                        'method':method,
                        'params':params_copy
                    });
                }

                window.awz_helper.prepared_ids_timeouts = [];
                var promBach = function(batch_prepare){
                    return new Promise((resolve, reject) => {
                        var timer = 10;
                        var cur_cnt = 0;
                        var i = 0;
                        var selectIds = [];
                        window.awz_helper.prepared_ids = true;
                        window.AwzBx24Proxy.callBatch(batch_prepare, function(result)
                        {
                            window.awz_helper.addBxTime(result);
                            var k;
                            for(k in result){
                                var answer = result[k]['answer'];
                                if(method === 'tasks.task.list'){
                                    var k2;
                                    for(k2 in answer['result']['tasks']){
                                        i++;
                                        selectIds.push(answer['result']['tasks'][k2]['id']);
                                        var timeout = setTimeout(function(){
                                            if(!window.awz_helper.prepared_ids) {
                                                reject(new Error("canseled"));
                                                return false;
                                            }
                                            cur_cnt += 1;
                                            myProgress.update(cur_cnt);
                                            console.log(window.awz_helper.prepared_ids);
                                        },timer*i);
                                        window.awz_helper.prepared_ids_timeouts.push(timeout);
                                    }
                                }else if(method === 'crm.item.list'){
                                    var k2;
                                    for(k2 in answer['result']['items']){
                                        i++;
                                        selectIds.push(answer['result']['items'][k2]['id']);
                                        var timeout = setTimeout(function(){
                                            if(!window.awz_helper.prepared_ids) {
                                                reject(new Error("canseled"));
                                                return false;
                                            }
                                            cur_cnt += 1;
                                            myProgress.update(cur_cnt);
                                        },timer*i);
                                        window.awz_helper.prepared_ids_timeouts.push(timeout);
                                    }
                                }
                            }
                            var timeout = setTimeout(function() {
                                resolve(selectIds);
                            },timer*i + 500);
                            window.awz_helper.prepared_ids_timeouts.push(timeout);
                        });
                    });
                };

                window.awz_helper.resize();
                promBach(batch_prepare).then(function(ids){
                    fields['ufCrm'+smartId+'Elements'] = ids;
                    send_item(entityId, fields, smartId);
                    myProgress.destroy();
                    window.awz_helper.resize();
                    window.awz_helper.prepared_ids_timeouts = [];
                },function(){
                    myProgress.destroy();
                    window.awz_helper.resize();
                    var k;
                    for(k in window.awz_helper.prepared_ids_timeouts){
                        clearTimeout(window.awz_helper.prepared_ids_timeouts[k]);
                    }
                    window.awz_helper.prepared_ids_timeouts = [];
                });

            }else{
                send_item(entityId, fields, smartId);
            }
        },
        prepareGroupListParams: function(){

            //params['filter'] = window.awz_helper.replaceFilter(params['filter']);

            var method = 'crm.item.list';
            var params = {};
            var check_order_upper = false;
            var check_add_upper = false;
            params['filter'] = this.lastFilter;
            params['select'] = ['id'];
            params['order'] = this.lastOrder;
            var plc_info = BX24.placement.info();

            if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
                check_add_upper = true;
                if(plc_info.placement){
                    var entity_code_id = plc_info.placement.replace(/CRM_(.*)_DETAIL_TAB/g, "$1");
                    if(entity_code_id === 'DEAL'){
                        params['filter']['UF_CRM_TASK'] = 'D_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'LEAD'){
                        params['filter']['UF_CRM_TASK'] = 'L_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'CONTACT'){
                        params['filter']['UF_CRM_TASK'] = 'C_'+plc_info.options.ID;
                    }
                    if(entity_code_id === 'COMPANY'){
                        params['filter']['UF_CRM_TASK'] = 'CO_'+plc_info.options.ID;
                    }
                    if(entity_code_id.indexOf('DYNAMIC_')>-1){
                        var tmp = entity_code_id.replace(/([^0-9])/g, "");
                        params['filter']['UF_CRM_TASK'] = "T"+parseInt(tmp).toString(16)+'_'+plc_info.options.ID;
                    }
                }
            }else if(this.gridOptions.PARAM_1 === 'TASK_USER'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
                check_add_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'WORKS'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'COMPANY'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'CONTACT'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'DEAL'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'EXT_COMPANY'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'EXT_CONTACT'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'EXT_DEAL'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                method = this.gridOptions.method_list;
                params['select'] = ['ID'];
                check_order_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                method = this.gridOptions.method_list;
                check_order_upper = true;
                check_add_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'DOCS'){
                method = this.gridOptions.method_list;
            }else if(this.gridOptions.PARAM_1 === 'DOCS_CRM'){
                method = this.gridOptions.method_list;
                if(['DEAL','LEAD','CONTACT','COMPANY'].indexOf(this.gridOptions.PARAM_2)>-1 && plc_info.placement){
                    params['filter']['entityId'] = plc_info.options.ID;
                }
            }else if(this.gridOptions.PARAM_1.indexOf('TASK_GROUP_')>-1){
                method = this.gridOptions.method_list;
                params['select'] = ['ID', 'GROUP_ID'];
                check_order_upper = true;
                check_add_upper = true;
            }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                method = this.gridOptions.method_list;
                params['select'] = ['ID', 'GROUP_ID'];
                params['filter']['GROUP_ID'] = plc_info.options.GROUP_ID;
                check_order_upper = true;
                check_add_upper = true;
            }else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                method = this.gridOptions.method_list;
                params['entityTypeId'] = this.smartId;
            }else{
                alert('неизвестная приложению сущность '+this.smartId);
                return;
            }

            //TODO не хватает сущностей для выборки всех
            if(window.awz_helper.hasOwnProperty('addFilter') && typeof window.awz_helper.addFilter === 'object'){
                var fl_key;
                for(fl_key in window.awz_helper.addFilter){
                    params['filter'][fl_key] = window.awz_helper.addFilter[fl_key];
                }
            }

            params['filter'] = window.awz_helper.replaceFilter(params['filter']);

            return [method, params, check_order_upper, check_add_upper];
        },
        sleep: function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        canselGroupActions: function(){

            /*var dropdown = BX('base_action_select_control');
            var container = dropdown.parentNode;
            this.grid_ob.getParent().getActionsPanel().onChangeHandler(container);
            this.grid_ob.getParent().getActionsPanel().activateControl('default');*/
            this.reloadList();
            this.clearTimeouts();
            //this.grid_ob.getParent().getActionsPanel().removeItemsRelativeCurrent(BX('base_action_select_control'));
        },
        openDialogAwzCrm: function(controlId, entityIds, multiple){
            try{
                this.autoLoadEntity.showDialog(entityIds.split(','), controlId, (multiple === 'Y'));
            }catch (e) {
                console.log(e);
            }
        },
        openDialogCrmOne: function(controlId, entityIds, only_int){
            var ent = entityIds.split(',');
            var value = $('#'+controlId).val();
            BX24.selectCRM({
                entityType: ent,
                multiple: false,
                value: value
            },function(res){
                console.log(res);
                var ids = [];
                var k;
                var j;
                for(k in ent){
                    if(res.hasOwnProperty(ent[k])){
                        for(j in res[ent[k]]){
                            var val = res[ent[k]][j].id;
                            if (only_int){
                                var val_tmp = val.split('_');
                                if(val_tmp.length==2){
                                    val = val_tmp[1];
                                }
                            }
                            ids.push(val);
                        }
                    }
                }
                $('#'+controlId).val(ids.join(","));
            });
        },
        openDialogCrm: function(controlId, entityIds){
            var ent = entityIds.split(',');
            var value = $('#'+controlId).val();
            if(value) value = value.split(',');
            BX24.selectCRM({
                entityType: ent,
                multiple: true,
                value: value
            },function(res){
                var ids = [];
                var k;
                var j;
                for(k in ent){
                    if(res.hasOwnProperty(ent[k])){
                        for(j in res[ent[k]]){
                            ids.push(res[ent[k]][j].id);
                        }
                    }
                }
                $('#'+controlId).val(ids.join(","));
            });
        },
        openUserDialog: function(controlId){
            BX24.selectUser('Выберите сотрудника',function(res){
                $(controlId).val(res.id);
            });
        },
        openCustomDialog: function(){

            const button = document.getElementById('button');
            const dialog = new BX.UI.EntitySelector.Dialog({
                targetNode: button,
                enableSearch: true,
                context: 'MY_MODULE_CONTEXT',
                entities: [
                    {
                        id: 'user', // пользователи
                    },
                    {
                        id: 'department', // структура компании: выбор только пользователей
                    },
                ],
            });

            dialog.show();

        },
        popup: null,
        getPopupFields: function getPopupFields(id, title) {
            if (this.popup === null) {
                var tmpDiv = BX.create("div");
                tmpDiv.innerHTML = '<span>'+title+'</span>';
                this.popup = new BX.PopupWindow(id, null, {
                    titleBar: tmpDiv.firstChild.innerText,
                    className: 'popup-window popup-window-with-titlebar popup-window-fixed-width',
                    autoHide: true,
                    overlay: 0.3,
                    minWidth: 400,
                    maxWidth: 800,
                    maxHeight: 500,
                    closeByEsc: true,
                    buttons: [new BX.PopupWindowButton({
                        text: 'закрыть',
                        className: 'webform-small-button-blue webform-small-button',
                        events: {
                            click: function click() {
                                this.popupWindow.close();
                            }
                        }
                    })],
                    events: {
                        onPopupClose: function(){
                            window.awz_helper.popup.destroy();
                            window.awz_helper.popup = null;
                        }
                    }
                });
            }

            return this.popup;
        },
        addCustomLink: function(){
            var options = this.grid_ob.getParent().getUserOptions();
            var actions = [{
                action: 'custom',
                data: [
                    'add_link',
                    $('#popup-window-content-settings-wrap-link').find('input[name="title"]').val(),
                    $('#popup-window-content-settings-wrap-link').find('input[name="link"]').val()
                ]
            }];
            options.batch(actions, function () {
                window.awz_helper.grid_ob.getParent().reloadTable();
            }.bind(window.awz_helper.grid_ob.getParent()));
            if(this.popup !== null){
                this.popup.close();
                //this.popup.destroy();
                this.popup = null;
            }
        },
        rmCustomLink: function(key){
            var options = window.awz_helper.grid_ob.getParent().getUserOptions();
            var option = options.getOptions();
            console.log(option);
            var actions = [{
                action: 'custom_rm',
                data: option['custom'][key]
            }];
            options.batch(actions, function () {
                window.awz_helper.grid_ob.getParent().reloadTable();
            }.bind(window.awz_helper.grid_ob.getParent()));
            if(this.popup !== null){
                this.popup.close();
                //this.popup.destroy();
                this.popup = null;
            }
        }

    }


    //$('#placement-sett #select-crm-entity-to')
    $(document).on('click', '.awz-open-addlink', function(e){
        e.preventDefault();

        var options = window.awz_helper.grid_ob.getParent().getUserOptions().getOptions();

        var ht = '<div class="form-link-current">';
        if(options.hasOwnProperty('custom')){
            var k;
            for(k in options['custom']){
                console.log(options['custom'][k]);
                if(options['custom'][k][0] === 'add_link'){
                    ht += '<div class="row">'+options['custom'][k][1]+'<br>'+options['custom'][k][2]+'<br><a onclick="window.awz_helper.rmCustomLink(\''+k+'\');return false;" href="#">удалить</a></div>';
                }
            }
        }
        ht += '</div>';
        ht += '<div class="form-link"><div class="ui-ctl ui-ctl-textbox">\n' +
            '    <input type="text" class="ui-ctl-element" name="title" placeholder="Текст на кнопке">\n' +
            '</div></div>';
        ht += '<div style="margin-top:5px;"><div class="ui-ctl ui-ctl-textbox">\n' +
            '    <input type="text" class="ui-ctl-element" name="link" placeholder="Ссылка">\n' +
            '</div></div>';
        ht += '<div style="margin-top:5px;"><a href="#" onclick="window.awz_helper.addCustomLink();return false;" class="ui-btn ui-btn-sm ui-btn-success ui-btn-icon-success awz-save-link">добавить</a></div>';

        var popup = window.awz_helper.getPopupFields('settings-wrap-link', 'Добавление кнопки');
        popup.setContent(ht);
        popup.show();

    });
    $(document).on('click', '.awz-open-fields', function(e){
        e.preventDefault();
        var ht = '';
        var k;
        for(k in window.awz_helper.placement_el_cache){
            ht += '#'+k+'# - '+window.awz_helper.placement_el_cache[k]+'<br>';
        }
        var popup = window.awz_helper.getPopupFields('settings-wrap-field', 'Список полей для автозамены в фильтре и ссылках');
        popup.setContent('<div class="fields-wrap">'+ht+'</div>');
        popup.show();
    });
    $(document).on('click', '.close_ids_change', function(e){
        e.preventDefault();
        window.awz_helper.prepared_ids = false;
        window.awz_helper.canselGroupActions();
        window.awz_helper.clearTimeoutsVariables();
    });
    $(document).on('change', '#placement-sett #select-crm-entity-to', function(e){
        //var c_val = $(this).val();
        window.awz_helper.getPlacementsList();
    });
    $(document).on('click', '.open-dialog-deal, .open-dialog-company, .open-dialog-contact', function(e){
        e.preventDefault();
        var type = '';
        if($(this).hasClass('open-dialog-deal')) type = 'deal';
        if($(this).hasClass('open-dialog-company')) type = 'company';
        if($(this).hasClass('open-dialog-contact')) type = 'contact';
        var inputField = $(this).parents('.field-wrap').find('input, a').eq(0);
        var value = [];
        var inpId = '#'+inputField.attr('id');
        if($(inpId+'_hidden').val()){
            value.push($('#'+inputField.attr('id')+'_hidden').val());
        }
        BX24.selectCRM({
            entityType: [type],
            value: value
        },function(res){
            var k;
            for(k in res[type]){
                var item = res[type][k];
                $(inpId+'_hidden').val(item.id);
                $(inpId).html('['+item.id+'] '+item.title);
                $(inpId).attr('onclick', 'window.AwzBx24Proxy.openPath("'+item.url+'");return false;');
            }
        });
    });
    $(document).on('click', '#awz-save-grid-sett', function(e){
        //grid-settings-button
        /*var q_data_hook = {
            'grid_id':window.awz_helper.gridId,
            'key':window.awz_helper.key,
            'params':$('#custom-user-grid-sett').serialize()
        };*/
        $('.awz-save-grid-sett-tmp-keys').remove();
        $('#custom-user-grid-sett').append('<div class="awz-save-grid-sett-tmp-keys"><input type="hidden" name="grid_id" value="'+window.awz_helper.gridId+'"><input type="hidden" name="key" value="'+window.awz_helper.key+'"></div>');

        window.awz_helper.updateGridParams($('#custom-user-grid-sett').serialize(), function(data){
            console.log(data);
            try{
                if(data['status'] === 'error'){
                    var k;
                    for(k in data['errors']){
                        $('.err-rows-sett').append('<div class="ui-alert ui-alert-danger">'+data['errors'][k]['code']+': '+data['errors'][k]['message']+'</div>');
                    }
                    return;
                }
            }catch (e) {
                console.log(e);
            }
            window.awz_helper.loadHandledApp();
            BX.SidePanel.Instance.close();
        });

    });
    $(document).on('click', '#awz-save-hook-params', function(e){
        e.preventDefault();
        $('.err-rows-sett').html('');
        var q_data = {
            'domain':$('#signed_add_form').attr('data-domain'),
            'app':$('#signed_add_form').attr('data-app'),
            'signed':$('#signed_add_form').val(),
            'id': $(this).attr('data-id'),
            'hash': $(this).attr('data-hash'),
            'params':{
                'users': $('#users-right').val().split(','),
                'desc_admin':$('#placement-desc-admin').val(),
                'min_name_user':$('#placement-min-name-user').val(),
                'desc_user':$('#placement-desc-user').val(),
                'desc_icon':$('#placement-icon-user').val(),
                'desc_bg_hex':$('#placement-icon-hex').val(),
                'placements':[]
            }
        };
        if($('#placements-list').val()){
            q_data['params']['placements'] = $('#placements-list').val().split(',');
        }
        window.awz_helper.updateHookParams(q_data, function(data){
            console.log(data);
            try{
                if(data['status'] === 'error'){
                    var k;
                    for(k in data['errors']){
                        $('.err-rows-sett').append('<div class="ui-alert ui-alert-danger">'+data['errors'][k]['code']+': '+data['errors'][k]['message']+'</div>');
                    }
                    return;
                }
            }catch (e) {
                console.log(e);
            }
            window.awz_helper.loadHandledApp();
            BX.SidePanel.Instance.close();
        });
    });
    $(document).on('click', '.update_smart_handled', function(e){
        e.preventDefault();
        var placement = $(this).attr('data-placement');
        var handler = $(this).attr('data-handler');
        window.awz_helper.replaceHandler(handler, placement);
    });
    $(document).on('click', '.remove_smart_handled', function(e){
        e.preventDefault();
        var placement = $(this).attr('data-placement');
        var handler = $(this).attr('data-handler');
        var handler_bx = $(this).attr('data-bxhandler');
        if(handler_bx){
            handler = handler_bx;
        }
        if($(this).attr('data-type') === 'app-placement'){
            var q_data_del = {
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val()
            }
            q_data_del['id'] = $(this).attr('data-id');
            q_data_del['hash'] = $(this).attr('data-hash');
            window.awz_helper.deleteHook(q_data_del, function(){
                window.awz_helper.loadHandledApp();
            });
            return;
        }
        BX24.callMethod(
            'placement.unbind',
            {
                'PLACEMENT': placement,
                'HANDLER': handler
            },
            function(res)
            {
                window.awz_helper.addBxTime(res);

                try{
                    var q_data_del = {
                        'domain':$('#signed_add_form').attr('data-domain'),
                        'app':$('#signed_add_form').attr('data-app'),
                        'signed':$('#signed_add_form').val()
                    }
                    var id = handler_bx.match(/ID=([0-9]+)/i);
                    var token = handler_bx.match(/TOKEN=([0-9a-zA-Z]+)/i);
                    q_data_del['id'] = id[1];
                    q_data_del['hash'] = token[1];
                    window.awz_helper.deleteHook(q_data_del);

                }catch (e) {
                    console.log(e.message);
                }


                window.awz_helper.loadHandledApp();
            }
        );
    });

    $(document).on('click', '.open-smart', function(e){
        e.preventDefault();
        var id = $(this).attr('data-id');
        var ent = $(this).attr('data-ent');
        if(!id){
            id = $(this).attr('href');
        }
        var path = window.AwzBx24Proxy.createPath(ent, id);
        window.AwzBx24Proxy.openPath(path);
    });


    $(document).on('click', '.remove_ext_smart_handled', function(e){
        e.preventDefault();
        var handler = $(this).attr('data-handler');

        var options = {};
        options[handler] = '';

        BX24.callMethod(
            'user.option.set',
            {
                'options': options
            },
            function(res)
            {
                window.awz_helper.addBxTime(res);
                window.awz_helper.loadHandledApp();
            }
        );
    });
    $(document).on('click', '#external-entity-manager-add', function(e){
        e.preventDefault();

        var type = $('#external-entity-manager-from').val();
        var hook = $('#external-entity-manager-huk').val();

        var serialize_param = type+'---'+hook;
        var hash = md5(serialize_param);
        var options = {};
        options['e_'+hash] = serialize_param;

        BX24.callMethod(
            'user.option.set',
            {
                'options': options
            },
            function(res)
            {
                window.awz_helper.addBxTime(res);
                window.awz_helper.loadHandledApp();
            }
        );

    });
    window.AwzBx24Proxy.initHandlers();
});