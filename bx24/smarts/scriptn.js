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
    codes: {
        from:{},
        to:{},
        type:{},
    },
    getTitle:function(code, type){
        if(typeof code !== 'string') return '';
        if(typeof type !== 'string') return '';
        if(!this.codes.hasOwnProperty(type)) return '';
        if(type === 'type'){
            var all_pls = this.getAllPlacements();
            if(all_pls.hasOwnProperty(code)){
                return all_pls[code];
            }
        }else if(this.codes[type].hasOwnProperty(code)){
            return this.codes[type][code];
        }
        return '';
    },
    getTitleFrom: function(code){
        return this.getTitle(code, 'from');
    },
    getTitleTo: function(code){
        return this.getTitle(code, 'to');
    },
    getTitleType: function(code){
        return this.getTitle(code, 'type');
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
        this.getAllPlacements();
        return this;
    },
    createAllPlacementsList: function(selId){
        $('#'+selId).html('<option value="">Выберите встройку</option>');
        var p = this.getAllPlacements();
        var k;
        for(k in p){
            if(k === 'REST_APP_URI') continue;
            $('#'+selId).append('<option value="'+k+'">'+p[k]+'</option>');
        }
    },
    getAllPlacements: function(){
        if(this.hasOwnProperty('all_placements')){
            return this.all_placements;
        }
        var codes = {
            'LEAD':['лидов','лида'],
            'DEAL':['сделок','сделки'],
            'CONTACT':['контактов','контакта'],
            'COMPANY':['компаний','компании']
        };
        this.all_placements = {
            'LEFT_MENU':'Левое меню (приложения)',
            'REST_APP_URI':'Ссылка на приложение с параметрами',
            'CRM_INVOICE_LIST_MENU':'Контекстное меню счетов',
            'CRM_QUOTE_LIST_MENU':'Контекстное меню предложений',
            'CRM_ACTIVITY_LIST_MENU':'Контекстное меню дел',
            'CRM_ANALYTICS_MENU':'Меню CRM-аналитики',
            'CRM_FUNNELS_TOOLBAR':'Кнопка в тулбаре Тунелей продаж',
            'CRM_ANALYTICS_TOOLBAR':'Кнопка в тулбаре CRM-аналитики',
            'TASK_USER_LIST_TOOLBAR':'Кнопка около роботов задачах',
            'TASK_LIST_CONTEXT_MENU':'Контекстное меню списка задач',
            'TASK_VIEW_TAB':'Вкладка в форме просмотра задачи',
            'TASK_VIEW_SIDEBAR':'Боковая панель формы просмотра задачи',
            'TASK_VIEW_TOP_PANEL':'Пункт в верхнем меню формы просмотра задачи',
            'TASK_GROUP_LIST_TOOLBAR':'Кнопка около роботов в задачах группы',
            'SONET_GROUP_TOOLBAR':'Кнопка на вкладке Основное в группе',
            'SONET_GROUP_ROBOT_DESIGNER_TOOLBAR':'Кнопка у роботов в группе',
            'USER_PROFILE_MENU':'Кнопка в главном меню портала',
            'USER_PROFILE_TOOLBAR':'Кнопка в профиле пользователя',
            'SONET_GROUP_DETAIL_TAB':'Закладка рабочей группы',
        };
        var k;
        for(k in codes){
            this.all_placements['CRM_'+k+'_LIST_MENU'] = 'Контекстное меню '+codes[k][0];
            this.all_placements['CRM_'+k+'_DETAIL_TAB'] = 'Пункт в табе в карточке '+codes[k][1];
            this.all_placements['CRM_'+k+'_DETAIL_ACTIVITY'] = 'Пункт в меню таймлайна '+codes[k][1];
            this.all_placements['CRM_'+k+'_DETAIL_TOOLBAR'] = 'Пункт в списке приложений карточки '+codes[k][1];
            this.all_placements['CRM_'+k+'_LIST_TOOLBAR'] = 'Кнопка около Роботов в списке '+codes[k][0];
            this.all_placements['CRM_'+k+'_DOCUMENTGENERATOR_BUTTON'] = 'Кнопка в документах '+codes[k][1];
        }
        return this.all_placements;
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
        if(!this.codes.from.hasOwnProperty(option.value)){
            this.codes.from[option.value] = option.title;
        }
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
        if(!this.codes.to.hasOwnProperty(option.value)){
            this.codes.to[option.value] = option.title;
        }
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
        if(!this.codes.type.hasOwnProperty(option.value)){
            this.codes.type[option.value] = option.title;
        }
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
        $(document).on('click', '.placement-sett-manager-add, #placement-sett-manager-add', function(e){
            e.preventDefault();
            var v = parentConstructor.getValues();
            var preset = $(this).attr('data-id');
            if(preset){
                var tmp_ar = preset.split(',');
                if(tmp_ar.length == 3){
                    tmp_ar.push('');
                }
                parentConstructor.addHandler(tmp_ar[0],tmp_ar[1],tmp_ar[2],tmp_ar[3]);
            }else{
                parentConstructor.addHandler(v['from'],v['to'],v['type'], v['name']);
            }
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
            'search_key': 'NAME_SEARCH'
        },
        'awz_user':{
            'caption': 'пользователь','short':'',
            'tab':'Пользователь',
            'alias':['USER','crm_user','user'],
            'm_list':'user.get',
            'm_search':'user.get',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#,\'USER_TYPE\':"employee"},\'start\':-1}',
            'm_search_params':'{\'filter\':{\'NAME_SEARCH\':"#QUERY#"},\'start\':-1}',
            'search_key': 'NAME_SEARCH'
        },
        'group':{
            'caption': 'группа','short':'',
            'tab':'Группа',
            'alias':['GROUP','awz_group'],
            'm_list':'sonet_group.get',
            'm_search':'sonet_group.get',
            'm_list_params':'{\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
            'm_search_params':'{\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
            'search_key': '%NAME'
        },
        'task':{
            'caption': 'задача','short':'',
            'tab':'Задачи',
            'alias':['TASK','TASKS','tasks','task_user'],
            'list_key':'tasks',
            'm_list':'tasks.task.list',
            'm_search':'tasks.task.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'CREATED_DATE\']}',
            'm_search_params':'{\'filter\':{\'TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'CREATED_DATE\']}',
            'search_key': 'TITLE'
        },
        'works':{
            'caption': 'дело','short':'',
            'tab':'Дела',
            'alias':['WORKS','work','WORK'],
            'list_key':'',
            'm_list':'crm.activity.list',
            'm_search':'crm.activity.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'SUBJECT\',\'CREATED\']}',
            'm_search_params':'{\'filter\':{\'%SUBJECT\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'SUBJECT\',\'CREATED\']}',
            'search_key': '%SUBJECT'
        },
        'company':{
            'caption': 'компания','short':'CO',
            'tab':'Компании',
            'alias':['COMPANY','crm_company'],
            'm_list':'crm.company.list',
            'm_search':'crm.company.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'search_key': '%TITLE'
        },
        'quote':{
            'caption': 'предложение','short':'Q',
            'tab':'Предложения',
            'alias':['QUOTE','crm_quote'],
            'm_list':'crm.quote.list',
            'm_search':'crm.quote.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'search_key': '%TITLE'
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
            'search_key': '%NAME'
        },
        'deal':{
            'caption': 'сделка','short':'D',
            'tab':'Сделки',
            'alias':['DEAL','crm_deal'],
            'm_list':'crm.deal.list',
            'm_search':'crm.deal.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\',\'OPPORTUNITY\',\'CURRENCY_ID\']}',
            'search_key': '%TITLE'
        },
        'lead':{
            'caption': 'лид','short':'L',
            'tab':'Лиды',
            'alias':['LEAD','crm_lead'],
            'm_list':'crm.lead.list',
            'm_search':'crm.lead.list',
            'm_list_params':'{\'filter\':{\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'm_search_params':'{\'filter\':{\'%TITLE\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'TITLE\',\'DATE_CREATE\']}',
            'search_key': '%TITLE'
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
            'search_key': '%title'
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

        window.AwzBx24Proxy.callApi('crm.type.list', {
                'order':{"title": "ASC"},
                'start':start
            }, function(res){
                //console.log('loadDynamicCrm crm.type.list',res);
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
                    console.log(e);
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
                'search_key': '%NAME'
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
                'search_key': '%NAME'
            };
            this.entKeys['s_catalog_'+type['iblockId']] = {
                'caption': type['name'],'short':'',
                'tab':type['name'],
                'alias':['S_CATALOG_'+type['iblockId'], 'iblock_section_'+type['iblockId']],
                'm_list':'crm.productsection.list',
                'm_search':'crm.productsection.list',
                'm_list_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'ID\':#IDS#},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'SECTION_ID\']}',
                'm_search_params':'{\'filter\':{\'CATALOG_ID\':'+type['entityTypeId']+',\'%NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'ID\',\'NAME\',\'SECTION_ID\']}',
                'search_key': '%NAME'
            };
        }else if(key === 'lists'){
            this.entKeys['list_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['LIST_'+type['ID'], 'iblock_element_'+type['ID'],'IB'+type['ID']],
                'm_list':'lists.element.get',
                'm_search':'lists.element.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
                'search_key': '%NAME'
            };
            this.entKeys['s_list_'+type['ID']] = {
                'caption': type['NAME'],'short':'',
                'tab':type['NAME'],
                'alias':['S_LIST_'+type['ID'], 'iblock_section_'+type['ID']],
                'm_list':'lists.section.get',
                'm_search':'lists.section.get',
                'm_list_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'ID\':#IDS#},\'start\':-1}',
                'm_search_params':'{\'IBLOCK_TYPE_ID\':\'lists\',\'IBLOCK_ID\':'+type['ID']+',\'FILTER\':{\'%NAME\':"#QUERY#"},\'start\':-1}',
                'search_key': '%NAME'
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
                'search_key': '%NAME'
            };
        }else if(key === 'lists_socnet'){

        }else if(key === 'rpa'){
            this.entKeys['RPA_'+type['entityTypeId']] = {
                'caption': type['title'],'short':'',
                'tab':type['title'],
                'alias':['rpa'+type['entityTypeId'],'rpa_'+type['entityTypeId'],'RPA'+type['entityTypeId']],
                'm_list':'rpa.item.list',
                'list_key':'items',
                'm_search':'rpa.item.list',
                'm_list_params':'{\'typeId\':'+type['entityTypeId']+',\'filter\':{\'id\':#IDS#},\'start\':-1,\'select\':[\'id\',\'name\',\'createdTime\']}',
                'm_search_params':'{\'typeId\':'+type['entityTypeId']+',\'filter\':{\'%UF_RPA_'+type['entityTypeId']+'NAME\':"#QUERY#"},\'start\':-1,\'select\':[\'id\',\'name\',\'createdTime\']}',
                'search_key': '%UF_RPA_'+type['entityTypeId']+'NAME'
            };
        }else if(!key){
            this.entKeys['dynamic_'+type['entityTypeId']] = {
                'caption': type['title'],'short':'T'+parseInt(type['entityTypeId']).toString(16),
                'tab':type['title'],
                'alias':['DYNAMIC_'+type['entityTypeId'],'crm_dynamic_'+type['entityTypeId']],
                'm_list':'crm.item.list',
                'list_key':'items',
                'm_search':'crm.item.list',
                'm_list_params':'{\'entityTypeId\':'+type['entityTypeId']+',\'filter\':{\'id\':#IDS#},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\']}',
                'm_search_params':'{\'entityTypeId\':'+type['entityTypeId']+',\'filter\':{\'%title\':"#QUERY#"},\'start\':-1,\'select\':[\'id\',\'title\',\'createdTime\',\'opportunity\',\'currencyId\',\'order\':{\'id\':\'desc\'}]}',
                'search_key': '%title'
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
            if(!this.entKeys.hasOwnProperty(code.toLowerCase()))
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
        //console.log([type, itm, itm_resp]);

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
        $('#ui-entity-userfield-awz').css({'min-height':'0px'});
        setTimeout(function(){
            window.awz_helper.resize();
        },300);
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
            /*if(type=='awzuientity' && id){
                var tmpVal = id.split('_');
                type = tmpVal[0];
                id = tmpVal[1];
                $(this).attr('data-id', id);
            }*/
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
            window.awz_helper.resize();
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
                        window.AwzBx24Proxy.callApi(tmp_method, tmp_params, function(res){
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
                                //window.awz_helper.resize();
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
                        //console.log([method,method_params]);
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
                        //window.awz_helper.resize();
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
        //console.log(entries);
        var parent = this;
        var k;
        for(k in entries){
            var ent_code = this.getEntityCode(entries[k]);
            if(this.lastTab === entries[k]){
                var method = this.getEntityParam(ent_code, 'm_search');
                var method_url = this.getEntityParam(ent_code, 'url');
                try{
                    var method_params;
                    eval('method_params = '+this.getEntityParam(ent_code, 'm_search_params').replaceAll('#QUERY#',this.lastQuery)+';');
                    method_params = Object.assign({}, method_params);
                    if(!method_params.hasOwnProperty('length')){
                        method_params = [method_params];
                    }
                    var k2;
                    k2 = 0;
                    this.dialog.getItems().forEach(function(item){
                        if(!item.isSelected()) {
                            if(item.getEntityType() === entries[k]) item.getDialog().removeItem(item);
                        }
                    });
                    var k2;
                    var ext_exit = false;
                    for(k2 in method_params){
                        if(ext_exit) break;
                        if(this.lastQuery === '*'){
                            var s_key = this.getEntityParam(ent_code, 'search_key');
                            if(s_key){
                                if(method_params[k2].hasOwnProperty('filter') && method_params[k2]['filter'].hasOwnProperty(s_key))
                                    delete method_params[k2]['filter'][s_key];
                                if(method_params[k2].hasOwnProperty('FILTER') && method_params[k2]['FILTER'].hasOwnProperty(s_key))
                                    delete method_params[k2]['FILTER'][s_key];
                                console.log(method_params[k2], s_key);
                            }
                            //if(method_params.indexOf('filter')) delete
                            ext_exit = true;
                        }
                        window.AwzBx24Proxy.callApi(
                            method_url ? [method_url, method] : method,
                            method_params[k2],
                            function(res){
                                //console.log('getEntityParam',res);
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
                                    parent.dialog.addItem(parent.createItemOptions(itm, entries[k]));
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
                        if(this.lastEntries.indexOf(k2)>-1){
                            var shortCode = this.getEntityParam(k2,'short');
                            if(shortCode && inpVal[k].indexOf(shortCode+'_')>-1){
                                var itm = {
                                    'id':inpVal[k].replace(shortCode+'_','',inpVal[k]),
                                    'title':inpVal[k]
                                };
                                current_elements.push(this.createItemOptions(itm, k2));
                            }
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
        //console.log(['replaceItemFromItm',itm,type]);
        var item = this.createItemOptions(itm, type);

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
        var parent_type = this.getEntityParam(type, 'parent_alias');
        //parent_type = null;

        var defOptions = {
            linkTitle: 'подробнее',
            entityId: type,
            entityType: type,
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
        var caption = this.getEntityParam(parent_type ? parent_type : type, 'caption');
        if(!caption) caption = 'элемент';
        defOptions['caption'] = id+' '+caption;

        var title = null;
        if(itm.hasOwnProperty('TITLE') && itm['TITLE']){
            title = itm['TITLE'];
        }else if(itm.hasOwnProperty('title') && itm['title']){
            title = itm['title'];
        }else if(itm.hasOwnProperty('SUBJECT') && itm['SUBJECT']){
            title = itm['SUBJECT'];
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
        }else if(itm.hasOwnProperty('createdDate') && itm['createdDate']){
            defOptions['subtitle'] = this.format('date',itm['createdDate']);
        }else if(itm.hasOwnProperty('CREATED') && itm['CREATED']){
            defOptions['subtitle'] = this.format('date',itm['CREATED']);
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
        if(['awz_employee','awz_user'].indexOf(parent_type ? parent_type : type)>-1){
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
        if(['group','awz_group'].indexOf(parent_type ? parent_type : type)>-1){
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

        //console.log(['createItemOptionsFin',defOptions]);

        return defOptions;
    },
    loadPreSelectedItems: function(items){
        //console.log('loadPreSelectedItems',items);
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
                        window.AwzBx24Proxy.callApi(tmp_method, tmp_params, function(res){
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
                        //console.log('batchCaller[k][\'params\']',batchCaller[k]['params'],method_params);
                        eval("batchCaller[k]['params'] = "+method_params.replace('#IDS#','["'+batchIds[k].join('","')+'"]')+";");

                        batch_start = true;
                    }catch (e) {
                        delete batchCaller[k];
                        console.log(e);
                        console.log([method,method_params]);
                    }
                }
            }
        }
        if(batch_start){
            //console.log(['batchCaller', batchCaller]);
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
        //console.log(items, this.lastEntries);

        var add_short = false;
        if(this.lastEntries.length>1){
            add_short = true;
        }
        var values = [];
        var k;
        for(k in items){
            var itm = items[k];
            var short_code = this.getEntityParam(itm.getEntityType(),'short');
            //console.log(short_code, add_short);
            if(!add_short) add_short = this.getEntityParam(itm.getEntityType(),'add_short');
            var val_tmp = '';
            if(add_short && short_code){
                val_tmp = this.getEntityParam(itm.getEntityType(),'short')+'_'+itm.getId();
            }else{
                val_tmp = itm.getId();
            }
            if (val_tmp && values.indexOf(val_tmp)===-1){
                values.push(val_tmp);
            }
        }
        var mh = 486;
        $(this.dialog.getTargetNode()).find('input').val(values.join(','));
        if(window.awz_plc_setValues){
            window.awz_plc_setValues();
        }
        $('#ui-entity-userfield-awz').css({'min-height':(mh+60)+'px'});
        window.awz_helper.resize();
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
        this.appendPreparedEntities();
        this.lastEntries = [];
        var parent = this;
        var tabs = [];
        var k;
        for(k in entries){

            var entity = this.getEntityParam(entries[k], 'type');
            //console.log(entity);
            if(entity){
                tabs.push({
                    id: entries[k],
                    title: this.getEntityParam(entity, ['tab','caption']),
                    itemMaxDepth:10,
                    hovered: true
                });
                this.lastEntries.push(entries[k]);
            }
        }

        var startSelected = this.getCurrentElements('#'+nodeId+' input');

        if(!tabs.length) {
            alert('Описание сущности '+entries[0]+' не найдено');
            return false;
        }
        var width = 600;
        var height = 420;
        if(($(window).width()-160) < width) width = $(window).width()-160;
        $('.popup-window.ui-selector-popup-container').remove();
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
            width: width,
            height: height,
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
        $('#ui-entity-userfield-awz').css({'min-height':(486+60)+'px'});
        window.awz_helper.resize();
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
    appendPreparedEntities: function(){
        if(window.AwzBx24EntityLoader_ents){
            var k;
            for(k in window.AwzBx24EntityLoader_ents){
                if(k.indexOf('eval_')>-1){
                    this.setDynamicEntity(window.AwzBx24EntityLoader_ents[k]['type'],window.AwzBx24EntityLoader_ents[k]['key']);
                }else{
                    this.entKeys[k] = window.AwzBx24EntityLoader_ents[k];
                    this.entKeys[k]['m_list_params'] = this.entKeys[k]['m_list_params'].replace('\'#', '#');
                    this.entKeys[k]['m_list_params'] = this.entKeys[k]['m_list_params'].replace('#\'', '#');
                    this.entKeys[k]['m_list_params'] = this.entKeys[k]['m_list_params'].replace('"#', '#');
                    this.entKeys[k]['m_list_params'] = this.entKeys[k]['m_list_params'].replace('#"', '#');
                }
                //console.log(k);
            }
        }
    },
    init: function(){
        this.appendPreparedEntities();
        this.initHandlers();
        //this.loadDynamicCrm();
    }
}
window.AwzBx24Proxy = {
    createPath: function(ent, id){
        //console.log('createPath', ent, id);
        var upperEnt = ent;
        if(ent){
            upperEnt = upperEnt.toUpperCase();
        }
        if(ent && upperEnt.indexOf('HOOK_')>-1){
            var instance = window.AwzBx24EntityLoader_ob;
            var parent_type = instance.getEntityParam(ent, 'parent_alias');
            if(parent_type) ent = parent_type;
        }
        try{
            var prepareProviders = window.AwzBx24EntityLoader_ob.getLink(ent, id);
            if(prepareProviders) return prepareProviders;
        }catch (e) {
            console.log(e);
        }
        //console.log('createPath', ent, id);
        if(ent === 'task_user') ent = 'task';
        if(ent === 'TASK') ent = 'task';
        if(ent === 'placement'){
            return id;
        }
        if(ent === 'app'){
            return '/marketplace/view/'+window.awz_helper.MARKET_ID+'/'+id;
        }
        if(typeof id !== 'string') id = id.toString();
        if(!id){
            id = $(this).attr('href');
        }
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
        if(ent === 'EXT_LEAD') ent = 'lead';
        if(ent === 'employee') ent = 'user';
        if(ent === 'awz_employee') ent = 'user';
        if(ent === 'awz_user') ent = 'user';
        var path = '';
        if(ent.indexOf('s_catalog_')>-1){
            path = '/crm/catalog/section/'+id+'/?IBLOCK_ID='+ent.replace('s_catalog_','')+'&type=CRM_PRODUCT_CATALOG&lang=ru&ID='+id+'&find_section_section=0';
        }else if(ent.indexOf('catalog_')>-1){
            path = '/crm/catalog/'+ent.replace('catalog_','')+'/product/'+id+'/';
        }else if(ent.indexOf('LISTS_LISTS_')>-1){
            path = '/company/lists/'+ent.replace('LISTS_LISTS_','')+'/element/0/'+id+'/';
        }else if(ent.indexOf('bitrix_processes_')>-1){
            path = '/bizproc/processes/'+ent.replace('bitrix_processes_','')+'/element/0/'+id+'/';
        }else if(ent.indexOf('list_')>-1){
            path = '/company/lists/'+ent.replace('list_','')+'/element/0/'+id+'/';
        }else if(ent.indexOf('dynamic_')>-1){
            path = '/crm/type/'+ent.replace('dynamic_','')+'/details/'+id+'/';
        }else if(ent.indexOf('DYNAMIC_')>-1){
            path = '/crm/type/'+ent.replace('DYNAMIC_','')+'/details/'+id+'/';
        }else if(ent.indexOf('RPA_')>-1){
            path = '/rpa/item/'+ent.replace('RPA_','')+'/'+id+'/';
        }else if(ent.indexOf('rpa_')>-1){
            path = '/rpa/item/'+ent.replace('rpa_','')+'/'+id+'/';
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
    openPath: function(path, add_params){
        console.log(path);
        var dsbl_ext = false;
        if(path == '/marketplace/detail/awz.smartbag/') {
            dsbl_ext = true;

            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.review.click',
                data: {
                    'signed':add_params
                },
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 3000,
                async: true,
                success: function (res, textStatus) {
                    console.log(res)
                },
                error:function(){}
            });

        }
        if(!dsbl_ext && window.awz_helper.hasOwnProperty('extUrl')){
            var path_ext = window.awz_helper.extUrl.replace(/(.*?)\/rest\/.*/g,"$1") + path;
            $('body').append('<div style="z-index:2000!important;" class="awz-ext-window-bg"><div class="awz-ext-window"><h4>Переход на внешний портал</h4><div class="buttons">' +
                '<a href="#" class="close ui-btn ui-btn-xs ui-btn-danger">закрыть окно</a>'+
                '<a href="'+path_ext+'" target="_blank" class="close_ext ui-btn ui-btn-xs">перейти</a>'+
                '</div></div></div>');
        }else{
            BX24.openPath(path, function(e){
                if(e.hasOwnProperty('errorCode') && e['errorCode'] == 'PATH_NOT_AVAILABLE'){
                    if(path.indexOf('https:')===-1){
                        path = 'https://' + BX24.getDomain() + path;
                    }
                    $('body').append('<div style="z-index:2000!important;" class="awz-ext-window-bg"><div class="awz-ext-window"><h4>Отктытие в слайдере невозможно</h4><div class="buttons">' +
                        '<a href="#" class="close ui-btn ui-btn-xs ui-btn-danger">закрыть окно</a>'+
                        '<a href="' + path+'" target="_blank" class="close_ext ui-btn ui-btn-xs">перейти на страницу элемента</a>'+
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
        isObjectNoAr: function(item) {
            if(this.isArray(item)) return false;
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
    getAuth: function(cb){
        var auth = BX24.getAuth();
        if(auth){
            cb(auth);
        }else{
            BX24.refreshAuth(cb);
        }
    },
    callBatch: function(batch, callback, bHaltOnError, sendCallback, nobx){
        let parent = this;
        if(typeof callback !== 'function') callback = function(){};
        if(!sendCallback) sendCallback = function(){};
        if(window.awz_helper.hasOwnProperty('extUrl') || nobx){
            if(!!window.name)
            {
                var q = window.name.split('|');
                window.awz_helper.PARAMS.DOMAIN = q[0].replace(/\:(80|443)$/, '');
                window.awz_helper.PARAMS.PROTOCOL = parseInt(q[1])||0;
                window.awz_helper.PARAMS.APP_SID = q[2];
            }
            parent.getAuth(function(auth) {
                var PARAMS = window.awz_helper.PARAMS;
                var url = '';

                if(nobx && !window.awz_helper.hasOwnProperty('extUrl')){
                    url = 'http'+(PARAMS.PROTOCOL?'s':'')+'://' + PARAMS.DOMAIN + PARAMS.PATH + '/' + encodeURIComponent('batch') + '?auth='+auth.access_token;
                }else{
                    url = window.awz_helper.extUrl.replace('bxorm.api.hook.call','bxorm.api.hook.batch')+'batch';
                }

                var cmdData = {};
                var k;
                var cnt = 0;
                for(k in batch){
                    var batch_row = batch[k];
                    var query_data = '';
                    parent.prepareData(batch_row.params, '', function(res) {
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

                $.ajax({
                    url: url,
                    data: {cmd: cmdData, halt: 1},
                    dataType : "json",
                    type: "POST",
                    CORS: false,
                    crossDomain: true,
                    timeout: 180000,
                    async: false,
                    success: function (data, textStatus){
                        try{
                            //console.log(data);
                            if(data.hasOwnProperty('data') && data.hasOwnProperty('status') && data['status'] === 'success'){
                                data = data['data'];
                            }
                            window.awz_nhelper.last_resp = data;
                            if(data.hasOwnProperty('data') && data.hasOwnProperty('status') && data['status'] === 'error'){
                                window.awz_nhelper.checkRespError(data);
                            }else{
                                window.awz_helper.addBxTime(data);
                                if(data['result'].hasOwnProperty('result')){
                                    callback(data['result']['result']);
                                }else{
                                    callback(data['result']);
                                }
                            }

                        }catch (e) {
                            console.log(e);
                            window.awz_nhelper.checkRespError(e);
                        }
                    },
                    error: function (err){
                        window.awz_nhelper.checkRespError(err);
                    }
                });

            });

        }else{
            BX24.callBatch(batch, callback, bHaltOnError);
        }
    },
    callApi: function(method, data, cbAjax){
        let parent = this;
        let PARAMS = window.awz_helper.PARAMS;
        if(method === 'lists.element.get'){
            if(data.hasOwnProperty('order')){
                data['ELEMENT_ORDER'] = data['order'];
            }
        }
        if(!!window.name)
        {
            var q = window.name.split('|');
            PARAMS.DOMAIN = q[0].replace(/\:(80|443)$/, '');
            PARAMS.PROTOCOL = parseInt(q[1])||0;
            PARAMS.APP_SID = q[2];
        }

        parent.getAuth(function(auth){
            var url = '';
            var query_data = 'auth=' + auth.access_token;
            if(typeof method == 'string'){
                url = 'http'+(PARAMS.PROTOCOL?'s':'')+'://' + PARAMS.DOMAIN + PARAMS.PATH + '/' + encodeURIComponent(method) + '';
            }else if(typeof method == 'object' && method.hasOwnProperty('length')){
                url = method[0]+method[1];
                query_data = '';
            }

            parent.prepareData(data, '', function(res){
                query_data += '&' + res;

                if(typeof method == 'object'){

                }else if(window.awz_helper.hasOwnProperty('extUrl')){
                    url = url.replace(/(.*\/rest\/)(.*)/g, window.awz_helper.extUrl+"$2");
                    query_data = query_data.replace(/auth=[a-z0-9]+\&(.*?)/g, "$1");
                }
                //console.log('window.AwzBx24Proxy.prepareData', url, query_data);

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
if(!window['AwzFunc']){
    window['AwzFunc'] = {};
}
window.AwzFunc['replace'] = function(fieldId, fields, itemData)
{
    var replVal = {'#ID#':ID};
    var k;
    for (k in fields){
        if(window.AwzBx24Proxy.util_type.isString(fields[k])){
            replVal['#'+k+'#'] = fields[k];
        }else if(window.AwzBx24Proxy.util_type.isNumber(fields[k])){
            replVal['#'+k+'#'] = fields[k].toString();
        }
    }
    for(k in fields){
        if(window.AwzBx24Proxy.util_type.isString(fields[k])){
            if(fields[k].indexOf('#')>-1){
                var k2;
                for(k2 in replVal){
                    fields[k] = fields[k].replace(k2, replVal[k2]);
                }
            }

        }
    }
}
window.AwzFunc['summ'] = function(value)
{
    var summ = 0;
    if(window.AwzBx24Proxy.util_type.isArray(value)){

    }
}
window.AwzFunc['externalEval'] = function(filedId, fields, itemData){
    //console.log('func',filedId, fields, itemData);
    var post_ob = {};
    Object.assign(post_ob, itemData);
    post_ob['_fields'] = Object.assign({},fields);
    post_ob['_filedId'] = filedId;
    $.ajax({
        url:  'https://api.zahalski.dev/bx24/smarts.script/'+window.awz_helper.PARAMS['DOMAIN']+'/index.php?gridId='+window.awz_helper.gridId,
        data: post_ob,
        dataType: "html",
        type: "POST",
        CORS: false,
        crossDomain: true,
        timeout: 6000,
        async: false,
        success: function (data) {
            console.log(data);
            eval(data)
        }
    });
};

window.awz_nhelper = {
    debug: true,
    maxMethodTime: 300,
    entityIdsShortCodes: {
        'LEAD':'L',
        'DEAL':'D',
        'CONTACT':'C',
        'COMPANY':'CO',
        'INVOICE':'I',
        'SMART_INVOICE':'SI',
        'QUOTE':'Q',
        'REQUISITE':'RQ'
    },
    getShort: function(code){
        if(!code) return code;
        if(this.entityIdsShortCodes.hasOwnProperty(code)){
            return this.entityIdsShortCodes[code];
        }
        if(code.indexOf('DYNAMIC_')>-1){
            var tmp = code.replace(/([^0-9])/g, "");
            if(tmp){
                this.entityIdsShortCodes[code] = "T"+parseInt(tmp).toString(16);
                return this.entityIdsShortCodes[code];
            }
        }
        return '';
    },
    entityIdsLinkCodes: {
        '1':'L_',
        '2':'D_',
        '3':'C_',
        '4':'CO_',
        '5':'I_',
        '31':'SI_',
        '7':'Q_',
        '8':'RQ_'
    },
    entityIdsLinkId: {
        'L_':'1',
        'D_':'2',
        'C_':'3',
        'CO_':'4',
        'I_':'5',
        'SI_':'31',
        'Q_':'7',
        'RQ_':'8'
    },
    status: {
        ok: 'success',
        err: 'error'
    },
    handGroupTitles: {
        'REST_APP_URI':'Обработка URL приложением (для работы меню и гридов)',
        'ALL_LINKED': 'Гриды с активными встройками в Битрикс24',
        'APP_LINK':'Ссылки на текущее приложения с параметрами',
        'APP_EXLINK':'Ссылки на сторонние приложения с параметрами',
        'REST_APP_WRAP': 'Настраиваемые меню с иконками',
        'ALL':'Не определены или устаревшие',
        'ALL_BX': 'Не определены или устаревшие в Битрикс24'
    },
    errors:[],
    uTypes: window.AwzBx24Proxy.util_type,
    plcInfoGet: function(key, def){
        if(!def) def = '';
        if(!key) return def;
        var pls = this.plcInfo();
        if(pls.hasOwnProperty(key)) return pls[key];
        return def;
    },
    plcInfo: function(){
        if(this.hasOwnProperty('plc_info')){
            return this.plc_info;
        }
        this.plc_info = {
            'ID': '',
            'CRM_ID': '',
            'CRM_CODE': '',
            'CRM_ENT_CODE': '',
            'CRM_ENT_ID': '',
            'plc': '',
            'placement': '',
            'options': {}
        };
        try{
            var bxPlc = BX24.placement.info();
            var k;
            var k2;
            for(k in bxPlc){
                if(k === 'options' && this.uTypes.isObjectNoAr(bxPlc[k])){
                    for(k2 in bxPlc[k]){
                        this.plc_info[k2] = bxPlc[k][k2];
                    }
                }
                if(k === 'placement'){
                    this.plc_info['plc'] = bxPlc[k];
                }
                this.plc_info[k] = bxPlc[k];
            }

            if(this.plc_info['plc']){
                var entity_code_id = this.plc_info['plc'].replace(/CRM_(.*)_DETAIL_TAB/g, "$1");
                var entity_code_id_min = this.getShort(entity_code_id);
                if(entity_code_id_min){
                    this.plc_info['CRM_CODE'] = entity_code_id;
                    this.plc_info['CRM_ID'] = entity_code_id_min+'_'+this.plc_info['ID'];
                }
            }
            //установка опций для получения элемента
            if(this.plc_info['CRM_CODE'] && this.plc_info['ID']){
                var keys = [];
                try{
                    keys = Object.keys(window.AwzBx24EntityLoader_ob.entKeys);
                    var findKey = keys.indexOf(this.plc_info['CRM_CODE'].toLowerCase());
                    if(findKey===-1) findKey = keys.indexOf(this.plc_info['CRM_CODE'].toLowerCase());
                    if(findKey===-1) findKey = keys.indexOf(this.plc_info['CRM_CODE']);
                    if(findKey>-1){
                        this.plc_info['CRM_ENT_CODE'] = keys[findKey];
                    }
                }catch (e) {
                    console.log(e);
                }
            }else if(this.plc_info['plc'] && this.plc_info.hasOwnProperty('GROUP_ID') && this.plc_info['GROUP_ID']
                && ['TASK_GROUP_LIST_TOOLBAR'].indexOf(this.plc_info['plc'])>-1
            )
            {
                this.plc_info['CRM_ENT_CODE'] = 'group';
                this.plc_info['ID'] = this.plc_info['GROUP_ID'];
            }else if(this.plc_info['plc'] && this.plc_info.hasOwnProperty('taskId') && this.plc_info['taskId']
                && ['TASK_VIEW_TAB'].indexOf(this.plc_info['plc'])>-1
            )
            {
                this.plc_info['CRM_ENT_CODE'] = 'task';
                this.plc_info['ID'] = this.plc_info['taskId'];
            }
        }catch (e) {
            console.log(e);
        }
        try {
            if (this.plc_info['ID'].indexOf('_') > -1) {
                var tmp = this.plc_info['ID'].split('_');
                this.plc_info['ID'] = tmp[tmp[tmp.length - 1]];
                this.plc_info['CRM_ID'] = tmp.join('_');
            }
        }catch (e) {
            console.log(e);
        }
        return this.plc_info;
    },
    replaceFilter: function(filter){
        var new_filter = {};
        var k;
        var k2;
        var k3;
        var itmFind = window.awz_nhelper.getItemForPlacement();
        for(k in filter){
            var val = filter[k];
            try{
                if(typeof val === 'object'){
                    for(k3 in val){
                        for(k2 in itmFind){
                            val[k3] = val[k3].replace("#"+k2+"#", itmFind[k2]);
                        }
                    }
                }else{
                    if(val.indexOf("#")>-1 && itmFind){
                        for(k2 in itmFind){
                            val = val.replace("#"+k2+"#", itmFind[k2]);
                        }
                    }
                }
            }catch (e) {
                console.log('error replaceFilter',e);
            }
            new_filter[k] = val;
        }
        console.log(['replaceFilter', filter, new_filter]);
        return new_filter;
    },
    getItemForPlacement: function(init){
        if(!init){
            return this.el_cache;
        }
        var parent = this;
        return new Promise((resolve, reject) => {
            if(!parent.hasOwnProperty('el_cache')) {
                parent['el_cache'] = {};
                console.log('getItemForPlacement empty', parent.plcInfo());
            }else{
                resolve(parent['el_cache']);
                return;
            }
            var id = parent.plcInfoGet('ID');
            var entity = parent.plcInfoGet('CRM_ENT_CODE');
            var instance_loader = window.AwzBx24EntityLoader_ob;
            if(id && entity){
                var method = instance_loader.getMethodList(entity);
                var method_params = instance_loader.getEntityParam(entity, 'm_list_params');
                if(method && method_params){
                    try{
                        var tmp_method = instance_loader.getEntityParam(entity,'url') ? [instance_loader.getEntityParam(entity,'url'), method] : method;
                        eval("var tmp_params = "+method_params.replace('#IDS#','["'+[id].join('","')+'"]')+";");
                        var prm = Object.assign({}, tmp_params);
                        if(prm.hasOwnProperty('select')) delete prm['select'];
                        if(prm.hasOwnProperty('SELECT')) delete prm['SELECT'];
                        if(method == 'crm.deal.list'){
                            prm['select'] = ['*','UF_*'];
                        }
                        window.AwzBx24Proxy.callApi(tmp_method, prm, function(res){
                            try{
                                var k2;
                                var row = res['result'];
                                var listKey = instance_loader.getEntityParam(entity, 'list_key');
                                var itr = null;
                                if(listKey){
                                    itr = row[listKey];
                                }else{
                                    itr = row;
                                }
                                var itm = {};
                                if(itr){
                                    for(k2 in itr){
                                        itm = itr[k2];
                                        break;
                                    }
                                }
                                parent['el_cache'] = itm;
                                resolve(parent['el_cache']);
                            }catch (e) {
                                reject(e);
                            }
                        });
                    }catch (e) {
                        reject(e);
                        console.log(e);
                    }
                }else{
                    throw new Error('Метод для получения параметров элемента не найден');
                }
            }else{
                resolve(parent['el_cache']);
            }
        });
    },
    getHandGroupTitles: function(key){
        if(typeof key !== 'string') return 'Группа встроек';
        if(this.handGroupTitles.hasOwnProperty(key)){
            return this.handGroupTitles[key];
        }
        return key;
    },
    getAddData: function(data){
        var parent = this;
        return new Promise((resolve, reject) => {
            try{
                if(data.hasOwnProperty('smartId') && data['smartId']==='WORKS')
                {
                    var ids = [];
                    var BINDINGS_value = {};
                    var batch = {};
                    if(data.hasOwnProperty('items')){
                        var k;
                        for(k in data['items']){
                            ids.push(data['items'][k]['ID']);
                            batch['item_'+data['items'][k]['ID']] =
                                {'method':'crm.activity.binding.list', 'params':{'activityId':data['items'][k]['ID']}};
                        }
                    }
                    if(ids.length){

                        window.AwzBx24Proxy.callBatch(
                            batch,
                            function(res)
                            {
                                window.awz_helper.addBxTime(res);
                                Object.keys(batch).forEach(function(itm){
                                    if(res.hasOwnProperty(itm) && res[itm].hasOwnProperty('answer')){

                                        //parent.entityIdsLinkCodes[res[itm]['answer']['result']['entityTypeId']]

                                        BINDINGS_value[itm.replace('item_','')] = [];
                                        res[itm]['answer']['result'].forEach(function(_itm){
                                            BINDINGS_value[itm.replace('item_','')].push(
                                                parent.entityIdsLinkCodes[_itm['entityTypeId']]+''+_itm['entityId']
                                            );
                                        });
                                    }
                                });

                                var k;
                                for(k in data['items']){
                                    if(BINDINGS_value.hasOwnProperty(data['items'][k]['ID']))
                                        data['items'][k]['BINDINGS'] = BINDINGS_value[data['items'][k]['ID']];
                                }
                                resolve(data);
                            }
                        );

                    }else{
                        resolve(data);
                    }
                }else{
                    resolve(data);
                }
            }catch (e) {
                console.log(e);
                resolve(data);
            }
        });
    },
    getUpData: function(data, ob){
        var parent = this;

        var ids = [];

        var k;
        for(k in data['FIELDS']){
            var itm = data['FIELDS'][k];
            ids.push(k);
            var k2;
            for(k2 in itm){
                //console.log(k2, itm[k2]);
                if(k2.indexOf('_custom')>-1 && parent.uTypes.isObjectNoAr(itm[k2])){
                    var key_raw;
                    var raw_values = {};
                    var raw_values_keys = [];
                    var orig_field = k2.replace('_custom','');
                    var raw_type = '';
                    for(key_raw in itm[k2]){
                        if(key_raw == 'type'){
                            raw_type = itm[k2][key_raw];
                        }else if(key_raw.indexOf('_currency')>-1){
                            raw_values[key_raw] = itm[k2][key_raw];
                        }else{
                            if(itm[k2][key_raw]){
                                raw_values[key_raw] = itm[k2][key_raw];
                                raw_values_keys.push(key_raw);
                            }
                        }
                    }
                    if(raw_type == 'multiple_str'){
                        if(!raw_values_keys.length){
                            raw_values['0'] = '';
                        }
                        data['FIELDS'][k][orig_field] = raw_values;
                    }else if(raw_type == 'multiple_currency'){
                        var raw_values_new = {};
                        if(!raw_values_keys.length){
                            raw_values_new['0'] = '';
                        }else{
                            raw_values_keys.forEach(function(key){
                                var split_res = raw_values[key].split('|');
                                if(split_res.length>1){
                                    raw_values_new[key] = split_res[0]+'|'+split_res[1];
                                }else{
                                    raw_values_new[key] = raw_values[key]+'|'+raw_values[key+'_currency'];
                                }
                            });
                        }
                        data['FIELDS'][k][orig_field] = raw_values_new;
                    }else if(raw_type == 'one_currency'){
                        var raw_values_new = '';
                        if(raw_values_keys.length){
                            raw_values_keys.forEach(function(key){
                                var split_res = raw_values[key].split('|');
                                if(split_res.length>1){
                                    raw_values_new = split_res[0]+'|'+split_res[1];
                                }else{
                                    raw_values_new = raw_values[key]+'|'+raw_values[key+'_currency'];
                                }
                            });
                        }
                        data['FIELDS'][k][orig_field] = raw_values_new;
                    }
                }
                if(parent.uTypes.isArray(itm[k2])){
                    var newItems = [];
                    var is_obj_sel = false;
                    var k3;
                    for(k3 in itm[k2]){
                        //пробуем отыскать мультиселект
                        if(parent.uTypes.isObjectNoAr(itm[k2][k3])){
                            is_obj_sel = true;
                            if(itm[k2][k3].hasOwnProperty('VALUE')){
                                newItems.push(itm[k2][k3]['VALUE'])
                            }
                        }
                    }
                    if(is_obj_sel){
                        data['FIELDS'][k][k2] = newItems;
                    }
                }
            }

        }

        return new Promise((resolve, reject) => {
            var k;
            var next_step = function(){
                console.log('getUpData',data);
                try{
                    if(ob.gridOptions.PARAM_1 === 'WORKS'){
                        //console.log(data);
                        var idsBind = [];
                        var valBind = {};

                        for(k in data['FIELDS']){
                            if(data['FIELDS'][k].hasOwnProperty('BINDINGS')){
                                idsBind.push(k);
                                valBind[k] = [];
                                if(data['FIELDS'][k]['BINDINGS']){
                                    valBind[k] = data['FIELDS'][k]['BINDINGS'].split(',');
                                }
                                delete data['FIELDS'][k]['BINDINGS'];
                                delete data['FIELDS'][k]['BINDINGS_custom'];
                            }
                        }
                        if(idsBind.length){
                            var counter = 0;
                            var max_counter = 0;
                            var batch = {};
                            for(k in idsBind){
                                batch['item_'+idsBind[k]] =
                                    {'method':'crm.activity.binding.list', 'params':{'activityId':idsBind[k]}};
                            }
                            var return_resolve = function(){
                                counter += 1;
                                if(counter>=max_counter) {
                                    resolve(data);
                                }
                            };
                            window.AwzBx24Proxy.callBatch(
                                batch,
                                function(res)
                                {
                                    window.awz_helper.addBxTime(res);
                                    var BINDINGS_values = {};
                                    Object.keys(batch).forEach(function(itm){
                                        if(res.hasOwnProperty(itm) && res[itm].hasOwnProperty('answer')){

                                            //parent.entityIdsLinkCodes[res[itm]['answer']['result']['entityTypeId']]

                                            BINDINGS_values[itm.replace('item_','')] = [];
                                            res[itm]['answer']['result'].forEach(function(_itm){
                                                BINDINGS_values[itm.replace('item_','')].push(
                                                    parent.entityIdsLinkCodes[_itm['entityTypeId']]+''+_itm['entityId']
                                                );
                                            });
                                        }
                                    });
                                    //console.log(BINDINGS_values);

                                    var all_diffs = [];
                                    var key = 0;
                                    var max_bath = 50;
                                    //valBind - новые значения
                                    //BINDINGS_values - старые значения
                                    for(k in valBind){
                                        var k2;
                                        for(k2 in valBind[k]){
                                            if(BINDINGS_values[k].indexOf(valBind[k][k2])===-1){
                                                //добавить связь
                                                var _tmp = valBind[k][k2].split('_');
                                                _tmp[0] = _tmp[0]+'_';
                                                if(!all_diffs.length) all_diffs[key] = [];
                                                if(all_diffs[key].length>=max_bath){
                                                    key += 1;
                                                    all_diffs[key] = [];
                                                }
                                                all_diffs[key].push(
                                                    {
                                                        'method':'crm.activity.binding.add',
                                                        'params':{
                                                            'activityId':k,
                                                            'entityTypeId':parent.entityIdsLinkId[_tmp[0]],
                                                            'entityId':_tmp[1]
                                                        }
                                                    });
                                            }
                                        }
                                    }
                                    for(k in BINDINGS_values){
                                        var k2;
                                        for(k2 in BINDINGS_values[k]){
                                            if(valBind[k].indexOf(BINDINGS_values[k][k2])===-1){
                                                //удалить связь
                                                var _tmp = BINDINGS_values[k][k2].split('_');
                                                _tmp[0] = _tmp[0]+'_';
                                                if(!all_diffs.length) all_diffs[key] = [];
                                                if(all_diffs[key].length>=max_bath){
                                                    key += 1;
                                                    all_diffs[key] = [];
                                                }
                                                all_diffs[key].push(
                                                    {
                                                        'method':'crm.activity.binding.delete',
                                                        'params':{
                                                            'activityId':k,
                                                            'entityTypeId':parent.entityIdsLinkId[_tmp[0]],
                                                            'entityId':_tmp[1]
                                                        }
                                                    });
                                            }
                                        }
                                    }
                                    if(all_diffs.length){
                                        max_counter += all_diffs.length;
                                        all_diffs.forEach(function(_batch){
                                            setTimeout(function(){
                                                window.AwzBx24Proxy.callBatch(
                                                    _batch,
                                                    function(res)
                                                    {
                                                        window.awz_helper.addBxTime(res);
                                                        return_resolve();
                                                    }
                                                );
                                            },3000);
                                        });
                                    }else{
                                        resolve(data);
                                    }
                                }
                            );

                        }else{
                            resolve(data);
                        }
                        //console.log(idsBind);
                        //console.log(valBind);
                    }
                    else if(ob.gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1) {
                        try{
                            var idsValues = {};
                            window.AwzBx24Proxy.callApi('lists.element.get',{
                                'IBLOCK_TYPE_ID':'lists',
                                'IBLOCK_ID':ob.smartId,
                                'FILTER':{'=ID':Object.keys(data['FIELDS'])}
                            },function(itemsRes){
                                window.awz_helper.addBxTime(itemsRes);
                                if(itemsRes.hasOwnProperty('result')){
                                    itemsRes['result'].forEach(function(itm){
                                        var tmpId = itm['ID'];
                                        idsValues[tmpId] = itm;
                                        delete idsValues[tmpId]['ID'];
                                        //изменения полей
                                        var k5; //ид элемента
                                        for(k5 in data['FIELDS']){
                                            if(k5 != tmpId) continue;
                                            var itmNew = data['FIELDS'][k5];
                                            var k6;//код поля
                                            for(k6 in itmNew){
                                                if(k6.indexOf('_custom')>-1){

                                                }else if(k6.indexOf('PROPERTY_')>-1){
                                                    var tmp_ar = [itmNew[k6]];
                                                    var k7;
                                                    for(k7 in tmp_ar){
                                                        var search_key = '';
                                                        if(idsValues[k5].hasOwnProperty(k6)){
                                                            var k8;
                                                            //поиск существующего значения
                                                            for(k8 in idsValues[k5][k6]){
                                                                search_key = k8;
                                                            }
                                                        }else{
                                                            idsValues[k5][k6] = {};
                                                        }
                                                        if(!search_key) search_key = 'n0';
                                                        if(search_key){
                                                            idsValues[k5][k6][search_key] = tmp_ar[k7];
                                                        }
                                                    }
                                                }else{
                                                    //console.log(idsValues);
                                                    idsValues[k5][k6] = itmNew[k6];
                                                }
                                            }
                                        }
                                    });
                                    data['FIELDS'] = idsValues;
                                    resolve(data);
                                }else{
                                    throw new Error('Не удалось получить элементы списка');
                                }
                                //console.log(itemsRes);
                            });
                        }catch (e) {
                            console.log(e);
                            reject(data);
                            return;
                        }
                    }
                    else{
                        resolve(data);
                    }
                }catch (e) {
                    console.log(e);
                    resolve(data);
                }
            };

            var FIELD_ID = $('#awz_field_name_control').val();
            var FIELD_MULTIPLE = $('#awz_field_name_multiple_control').val();
            if(!FIELD_ID){
                return next_step();
            }

            var FIELD_UP_TYPE = $('#value_entry_type_control').attr('data-value');
            var FIELD_UP_FUNC = $('#value_entry_func_control').val();
            if(FIELD_UP_FUNC || (FIELD_UP_TYPE && ['add','remove'].indexOf(FIELD_UP_TYPE)>-1)){

                if(FIELD_UP_FUNC && FIELD_UP_FUNC.indexOf('(')===-1 && !window.AwzFunc.hasOwnProperty(FIELD_UP_FUNC)){
                    throw new Error('window.AwzFunc.'+FIELD_UP_FUNC+' - не найдена');
                }
                var params_get_data = {
                    'filter': {'id': ids}
                };
                if(window.awz_helper.hasOwnProperty('fields_select')){
                    if(window.awz_helper.fields_select)
                        params_get_data['select'] = window.awz_helper.fields_select;
                }
                parent.getItemsData(params_get_data).then(function(res){
                    var primary_key = 'id';
                    console.log('getItemsData res', res);
                    var itemsData = {};
                    if(parent.uTypes.isObject(res)){
                        for(k in res){
                            var itm = res[k];
                            if(itm.hasOwnProperty('ID')){
                                primary_key = 'ID';
                            }
                            itemsData[itm[primary_key]] = itm;
                        }
                    }

                    for(k in data['FIELDS']){
                        var itemData = itemsData[k];
                        console.log('itemData', itemData);
                        var fieldId = FIELD_ID;
                        if(FIELD_UP_FUNC){
                            try{
                                if(FIELD_UP_FUNC.indexOf('(')>-1){
                                    eval(FIELD_UP_FUNC);
                                }else{
                                    window.AwzFunc[FIELD_UP_FUNC].call(window.awz_helper, fieldId, data['FIELDS'][k], itemData);
                                }
                            }catch (e) {
                                throw e;
                                return;
                            }
                        }
                        var fieldData = itemData[fieldId];
                        var k2;
                        for(k2 in fieldData){
                            if(parent.uTypes.isNumber(fieldData[k2])){
                                fieldData[k2] = fieldData[k2].toString();
                            }
                        }
                        console.log('fieldData', fieldData, fieldId);
                        var currentData = $('#value_entry_control').val();
                        if(FIELD_MULTIPLE === 'Y'){
                            if(currentData.indexOf(',')>-1){
                                var tmp = currentData.split(',');
                                currentData = [];
                                tmp.forEach(function(itm){
                                    if(parent.uTypes.isString(itm)){
                                        currentData.push(itm.trim());
                                    }else{
                                        currentData.push(itm);
                                    }
                                });
                            }else if(currentData){
                                currentData = [currentData];
                            }else{
                                currentData = [];
                            }
                            console.log('currentData', currentData);
                            var replacedData = [];
                            if(FIELD_UP_TYPE === 'remove'){
                                if(parent.uTypes.isArray(fieldData)){
                                    fieldData.forEach(function(itm){
                                        if(parent.uTypes.isString(itm)){
                                            itm = itm.trim();
                                        }
                                        if(currentData.indexOf(itm)===-1){
                                            replacedData.push(itm);
                                        }
                                    });
                                }
                                data['FIELDS'][k][fieldId] = replacedData;
                            }else if(FIELD_UP_TYPE === 'add'){
                                replacedData = fieldData;
                                if(parent.uTypes.isArray(fieldData)){
                                    currentData.forEach(function(itm){
                                        if(parent.uTypes.isString(itm)){
                                            itm = itm.trim();
                                        }
                                        if(replacedData.indexOf(itm)===-1){
                                            replacedData.push(itm);
                                        }
                                    });
                                }
                                data['FIELDS'][k][fieldId] = replacedData;
                            }
                            console.log('replacedData', replacedData);
                        }
                    }
                    next_step();
                }).catch(function(e){
                    reject(e);
                    return;
                });

                //throw new Error(up_type_value+'('+$('#value_entry_type_control').text()+')'+' - не поддерживается');
                //reject(data);
                //return;
            }else{
                next_step();
            }


        });
    },
    getItemsData: function(params){
        var prepare_params = params;
        return new Promise((resolve, reject) => {
            var list_params = window.awz_helper.getMethodListParams(
                prepare_params,'list'
            );
            if(!list_params){
                throw Error('неизвестная приложению сущность '+window.awz_helper.smartId);
            }else{
                var method = list_params['method'];
                var check_order_upper = list_params['check_order_upper'];
                var check_add_upper = list_params['check_add_upper'];
                var params = list_params['params'];
                if(check_order_upper){
                    params['filter']['ID'] = params['filter']['id'];
                    delete params['filter']['id'];
                }
                console.log('params getItemsData',params)
            }

            window.AwzBx24Proxy.callApi(method, params, function(res){
                try{
                    //console.log('call_api_prepared', res);
                    window.awz_nhelper.checkRespError(res);
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
                        console.log('items_key_prepared', [items_key, res]);
                        if(res.hasOwnProperty('result')){
                            resolve(res.result[items_key]);
                            return;
                        }
                    }
                }catch (e) {
                    console.log(e);
                    var msg = '';
                    try{
                        msg = e.message;
                    }catch (e) {

                    }
                    throw new Error('Не удалось получить данные элементов. '+msg);
                }
                throw new Error('Не удалось получить данные элементов');
            });
        });
    },
    getAwzHookMethods: function(urls){
        //console.log('hooks',urls);
        return new Promise((resolve, reject) => {
            var k;
            var max_counter = urls.length;
            if(max_counter === 0) resolve([]);
            var counter = 0;
            var iterators = [];
            var return_resolve = function(){
                counter += 1;
                if(counter>=max_counter) {
                    resolve(iterators);
                }
            };
            for(k in urls){
                var url = urls[k].replace('api.hook.call', 'api.hook.methods');
                $.ajax({
                    url:  url,
                    data: {},
                    dataType: "json",
                    type: "POST",
                    CORS: false,
                    crossDomain: true,
                    timeout: 6000,
                    async: true,
                    success: function (data) {
                        //console.log('awz_hook methods',data);
                        try{
                            if(data['status']===window.awz_nhelper.status.err){
                                iterators.push(data)
                                return_resolve();
                            }else if(typeof data['data']['methods'] === 'object'){
                                data['data']['methods']['url'] = this.url.replace('api.hook.methods', 'api.hook.call');
                                iterators.push(data['data']['methods']);
                                return_resolve();
                            }
                        }catch (e) {
                            return_resolve();
                        }
                    },
                    error: function(e){
                        console.log(e);
                        return_resolve();
                    }
                });
            }
        });
    },
    getRpaHookMethods: function(urls){
        return new Promise((resolve, reject) => {
            var k;
            var max_counter = urls.length;
            if(max_counter === 0) resolve([]);
            var counter = 0;
            var iterators = [];
            var return_resolve = function(){
                counter += 1;
                if(counter>=max_counter) {
                    resolve(iterators);
                }
            };
            for(k in urls){
                var params_url = urls[k].split('---');
                var url = params_url[0];
                $.ajax({
                    url:  url+'rpa.type.list',
                    data: {},
                    dataType: "json",
                    type: "POST",
                    CORS: false,
                    crossDomain: true,
                    timeout: 6000,
                    async: true,
                    success: function (data) {
                        //console.log('getRpaHookMethods methods',data);
                        try{
                            data['result']['types'].forEach(function(itm){
                                itm['ext_type_key'] = params_url[1];
                                itm['ext_url'] = url;
                                iterators.push(itm);
                            });
                            return_resolve();
                        }catch (e) {
                            console.log(e);
                            return_resolve();
                        }
                    },
                    error: function(e){
                        console.log(e);
                        return_resolve();
                    }
                });
            }
        });
    },
    getListsHookMethods: function(urls){
        return new Promise((resolve, reject) => {
            var k;
            var max_counter = urls.length;
            if(max_counter === 0) resolve([]);
            var counter = 0;
            var iterators = [];
            var return_resolve = function(){
                counter += 1;
                if(counter>=max_counter) {
                    resolve(iterators);
                }
            };
            for(k in urls){
                //{'method':'lists.get', 'params':{'IBLOCK_TYPE_ID':'lists'}
                var params_url = urls[k].split('---');
                var url = params_url[0];
                $.ajax({
                    url:  url+'lists.get',
                    data: {
                        'IBLOCK_TYPE_ID':'lists'
                    },
                    dataType: "json",
                    type: "POST",
                    CORS: false,
                    crossDomain: true,
                    timeout: 6000,
                    async: true,
                    success: function (data) {
                        //console.log('getListsHookMethods methods',data);
                        try{
                            data['result'].forEach(function(itm){
                                itm['e_type_key'] = params_url[1];
                                itm['ext_url'] = url;
                                iterators.push(itm);
                            });
                            return_resolve();
                        }catch (e) {
                            console.log(e);
                            return_resolve();
                        }
                    },
                    error: function(e){
                        console.log(e);
                        return_resolve();
                    }
                });
            }
        });
    },
    getSmartHookMethods: function(urls){
        return new Promise((resolve, reject) => {
            var k;
            var max_counter = urls.length;
            if(max_counter === 0) resolve([]);
            var counter = 0;
            var iterators = [];
            var return_resolve = function(){
                counter += 1;
                if(counter>=max_counter) {
                    resolve(iterators);
                }
            };
            for(k in urls){
                var params_url = urls[k].split('---');
                var url = params_url[0];
                $.ajax({
                    url:  url+'crm.type.list',
                    data: {},
                    dataType: "json",
                    type: "POST",
                    CORS: false,
                    crossDomain: true,
                    timeout: 6000,
                    async: true,
                    success: function (data) {
                        try{
                            data['result']['types'].forEach(function(itm){
                                itm['e_type_key'] = params_url[1];
                                itm['ext_url'] = url;
                                iterators.push(itm);
                            });
                            return_resolve();
                        }catch (e) {
                            console.log(e);
                            return_resolve();
                        }
                    },
                    error: function(e){
                        console.log(e);
                        return_resolve();
                    }
                });
            }
        });
    },
    getEntityForPlacement: function(){
        var parent = this;
        return new Promise((resolve, reject) => {
            var counter = 0;
            var max_counter = 2;
            var maxTimeout = setTimeout(function(){
                reject(new Error('Истек таймаут соединения в 60 секунд на получение данных для встроек'));
            },60000);
            var batch = {
                'crm_type':{'method':'crm.type.list', 'params':{}},
                'rpa_type':{'method':'rpa.type.list', 'params':{}},
                'lists_lists':{'method':'lists.get', 'params':{'IBLOCK_TYPE_ID':'lists'}},
                //'lists_socnet':{'method':'lists.get', 'params':{'IBLOCK_TYPE_ID':'lists_socnet','SOCNET_GROUP_ID':10}},
                'sonet_group':{'method':'sonet_group.get',
                    'params':{'IS_ADMIN': 'Y', 'FILTER ':{'ACTIVE':'Y'}}
                },
                'user_option':{'method':'user.option.get'},
                'placement_get':{'method':'placement.get'},
                'userfield_type':{'method':'userfieldtype.list'},
            };
            var iterators = {
                'awz_hook_list':null,
                'awz_orm':null,
                'ex_lists_lists':null,
                'ex_smart':null,
                'ex_rpa':null,
                'crm_type':null,
                'lists_lists':null,
                'placement_get':null,
                'sonet_group':null,
                'user_option':null,
                'userfield_type':null,
            };

            var return_resolve = function(){
                //console.log('return_resolve',counter,max_counter);
                counter += 1;
                if(counter>=max_counter) {
                    clearTimeout(maxTimeout);
                    resolve(iterators);
                }
            };
            var rej_return = function(data){
                clearTimeout(maxTimeout);
                reject(data);
            };

            $.ajax({
                url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.listhook',
                data: {
                    'domain':$('#signed_add_form').attr('data-domain'),
                    'app':$('#signed_add_form').attr('data-app'),
                    'signed':$('#signed_add_form').val()
                },
                dataType: "json",
                type: "POST",
                CORS: false,
                crossDomain: true,
                timeout: 180000,
                async: true,
                success: function (hookList, textStatus) {
                    try{
                        if(hookList['status'] === parent.status.ok){
                            iterators['awz_hook_list'] = hookList['data'];
                        }else if(hookList['status'] === parent.status.err){
                            iterators['awz_hook_list'] = [];
                        }else{
                            rej_return(new Error('awz_api', 'Неизвестный ответ сервиса приложения'));
                        }
                    }catch (e) {
                        rej_return(e);
                    }
                    return_resolve();
                },
                error:function(){
                    rej_return(new Error('awz_api', 'Ошибка на сервисе приложения'));
                }
            });

            window.AwzBx24Proxy.callBatch(
                batch,
                function(res)
                {
                    window.awz_helper.addBxTime(res);
                    //console.log(res);
                    var urls = [];
                    var urls_rpa = [];
                    var urls_smart = [];
                    var urls_lists_lists = [];
                    Object.keys(batch).forEach(function(itm){
                        iterators[itm] = null;
                        if(res.hasOwnProperty(itm) && res[itm].hasOwnProperty('answer')){
                            if(['crm_type','rpa_type'].indexOf(itm)>-1){
                                iterators[itm] = res[itm].answer.result['types'];
                            }else{
                                var tmp = res[itm].answer.result;
                                if(itm === 'user_option' && tmp){
                                    Object.keys(tmp).forEach(function(key){
                                        if(!key) return;
                                        if(key.indexOf('e_')===-1 && key.indexOf('entity_')===-1) return;
                                        var item = tmp[key];
                                        var extItem = item.split('---');
                                        if(extItem.length < 2) return;
                                        if(!iterators[itm]) iterators[itm] = {};
                                        iterators[itm][key] = item;
                                        if(extItem[0] === 'awzorm'){
                                            urls.push(extItem[1]);
                                        }else if(extItem[0] === 'rpa'){
                                            urls_rpa.push(extItem[1]+'---'+key);
                                        }else if(extItem[0] === 'lists_lists'){
                                            urls_lists_lists.push(extItem[1]+'---'+key);
                                        }else if(extItem[0] === 'smart'){
                                            urls_smart.push(extItem[1]+'---'+key);
                                        }
                                    });
                                }else{
                                    iterators[itm] = tmp;
                                }
                            }
                        }
                    });
                    parent.getAwzHookMethods(urls).then((hooks)=>{
                        iterators['awz_orm'] = hooks;
                        return parent.getRpaHookMethods(urls_rpa);
                    }).then((hooks)=>{
                        iterators['ex_rpa'] = hooks;
                        return parent.getSmartHookMethods(urls_smart);
                    }).then((hooks)=>{
                        iterators['ex_smart'] = hooks;
                        return parent.getListsHookMethods(urls_lists_lists);
                    }).then((hooks)=>{
                        iterators['ex_lists_lists'] = hooks;
                        return_resolve();
                    });
                }
            );

        });
    },
    appendExtHook: function(ext_hooks){
        ext_hooks.forEach(function(item){
            $('.rows-ext-smarts').append('<div class="row" style="margin-bottom:10px;">' +
                '<div class="col-xs-3 no-padding-l">' +
                '<label class="main-grid-control-label">'+item['key']+'</label>' +
                '</div>' +
                '<div class="col-xs-3">' +
                '<label class="main-grid-control-label">'+item['title']+'</label>' +
                '</div>' +
                '<div class="col-xs-3">' +
                '<label class="main-grid-control-label">'+item['url_title']+'</label>' +
                '</div>' +
                '<div class="col-xs-3 no-padding-r">' +
                '<a href="#" data-handler="'+item['key']+'" class="remove_ext_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Удалить</a>' +
                '</div>' +
                '</div>');
        });
        window.awz_helper.resize();
    },
    getHandlerFromHash: function(md5_hash){
        var hash = '';
        if(typeof md5_hash === 'object' && md5_hash.hasOwnProperty('md5_2')){
            hash = md5_hash['md5_2'];
        }else if(typeof md5_hash === 'object' && md5_hash.hasOwnProperty('md5')){
            hash = md5_hash['md5'];
        }else{
            hash = md5_hash;
        }
        if(typeof hash === 'string' && this.hashes.hasOwnProperty(hash)){
            return this.hashes[hash];
        }else{
            return null;
        }
    },
    createHashesHandlers: function(handlersAwz, handlersBx){
        this.hashes = {};
        var parent = this;
        Object.keys(handlersAwz).forEach(function (handler_key) {
            var handler = handlersAwz[handler_key];
            if(handler && handler.hasOwnProperty('URL')){
                var hash = md5(handler['URL']);
                handler['md5'] = hash;
                if(!parent.hashes.hasOwnProperty(hash)){
                    parent.hashes[hash] = {'awz':handler};
                }else{
                    parent.hashes[hash]['awz'] = handler;
                }
                handler['hash_url'] = '&ID='+handler['ID']+'&TOKEN='+handler['HASH'];
                var hash_link = md5(handler['ID']);
                handler['md5_2'] = hash_link;
                if(!parent.hashes.hasOwnProperty(hash_link)){
                    parent.hashes[hash_link] = {'awz':handler};
                }else{
                    parent.hashes[hash_link]['awz'] = handler;
                }
            }
        });
        handlersBx.forEach(function (handler) {
            if(handler.hasOwnProperty('handler')){
                var hash = md5(handler['handler']);
                handler['md5'] = hash;
                if(!parent.hashes.hasOwnProperty(hash)){
                    parent.hashes[hash] = {'bx':handler};
                }else{
                    parent.hashes[hash]['bx'] = handler;
                }

                if(handler['handler'].indexOf('MENUID=')>-1) {
                    var handlerId = handler['handler'].match(/MENUID=([0-9]+)/i);
                    if(handlerId.hasOwnProperty('length') && handlerId['length']===2){
                        var hash_link = md5(handlerId[1]);
                        handler['md5_2'] = hash_link;
                        if(parent.hashes.hasOwnProperty(hash_link) &&
                            parent.hashes[hash_link].hasOwnProperty('awz')
                        ){
                            if(!parent.hashes[hash_link]['awz'].hasOwnProperty('links')){
                                parent.hashes[hash_link]['awz']['links'] = [];
                            }
                            parent.hashes[hash_link]['awz']['links'].push(handler);
                        }
                        handler['parent_awz'] = handlerId[1];
                    }
                }else if(handler['handler'].indexOf('ID=')>-1 && handler['handler'].indexOf('&TOKEN=')>-1) {
                    var handlerId = handler['handler'].match(/ID=([0-9]+)/i);
                    var tokenId = handler['handler'].match(/TOKEN=([0-9a-zA-Z]+)/i);
                    if(handlerId.hasOwnProperty('length') && handlerId['length']===2 &&
                        tokenId.hasOwnProperty('length') && tokenId['length']===2
                    ){
                        handler['hash_url'] = '&ID='+handlerId[1]+'&TOKEN='+tokenId[1];
                        var hash_link = md5(handlerId[1]);
                        handler['md5_2'] = hash_link;
                        if(!parent.hashes.hasOwnProperty(hash_link)){
                            parent.hashes[hash_link] = {'bx':handler};
                        }else{
                            parent.hashes[hash_link]['bx'] = handler;
                        }
                    }
                }
            }
        });
        //console.log(parent.hashes);
    },
    appendHandlers: function(handlersAwz, handlersBx, handlersUserFields) {
        this.createHashesHandlers(handlersAwz, handlersBx);
        var parent = this;
        Object.keys(this.handGroupTitles).forEach(function(group_key){
            var check_class = 'rows-smarts-'+group_key;
            var group = $('.rows-smarts').find('.'+check_class);
            if(!group.length){
                $('.rows-smarts').append('<div class="row-placement-title-block '+check_class+'"><div class="row row-title"><h4>'+parent.getHandGroupTitles(group_key)+'</h4></div></div>');
            }
        });
        Object.keys(handlersAwz).forEach(function (handler_key) {
            var handler = handlersAwz[handler_key];
            if(handler.hasOwnProperty('PARAMS') &&
                handler['PARAMS'].hasOwnProperty('handler') &&
                handler['PARAMS']['handler'].hasOwnProperty('from') &&
                handler['PARAMS']['handler']['from'] === 'APP_EXLINK'
            ){
                parent.appendHandlerRow(handler, 'APP_EXLINK');
            }else if(handler.hasOwnProperty('PARAMS') &&
                handler['PARAMS'].hasOwnProperty('handler') &&
                handler['PARAMS']['handler'].hasOwnProperty('type') &&
                handler['PARAMS']['handler']['type'] === 'REST_APP_WRAP'
            ){
                parent.appendHandlerRow(handler, 'REST_APP_WRAP');
            }else if(handler.hasOwnProperty('PARAMS') &&
                handler['PARAMS'].hasOwnProperty('handler') &&
                handler['PARAMS']['handler'].hasOwnProperty('type') &&
                handler['PARAMS']['handler']['type'] === 'REST_APP_URI'
            ){
                parent.appendHandlerRow(handler, 'APP_LINK');
            }else{
                parent.appendHandlerRow(handler, 'ALL');
            }
        });
        handlersBx.forEach(function (handler) {
            if(handler.hasOwnProperty('placement') && handler['placement'] === 'REST_APP_URI'){
                parent.appendHandlerRow(handler, 'REST_APP_URI');
            }else{
                parent.appendHandlerRow(handler, 'ALL_BX');
            }
        });
        handlersUserFields.forEach(function (handler) {
            if(handler.hasOwnProperty('USER_TYPE_ID') && handler['USER_TYPE_ID'] === 'awzuientity'){
                parent.appendHandlerRow(handler, 'REST_APP_URI');
            }
        });

    },
    appendHandlerRow: function(handler, type){

        if(handler.hasOwnProperty('placement') &&
            handler['placement'] === 'REST_APP_URI'){
            $('.row-REST_APP_URI').hide();
        }
        if(handler.hasOwnProperty('USER_TYPE_ID') &&
            handler['USER_TYPE_ID'] === 'awzuientity'){
            $('.row-REST_APP_USERFIELD').hide();
        }
        var sett_handler = 'sett-handler';
        //console.log('appendHandlerRow',handler, type);
        var plsMan = window.AwzBx24PlacementManager_ob;
        var check_class = 'rows-smarts-'+type;
        var group = $('.rows-smarts').find('.'+check_class);
        if(!group.length){
            $('.rows-smarts').append('<div class="row-placement-title-block '+check_class+'"><div class="row row-title"><h4>'+this.getHandGroupTitles(type)+'</h4></div></div>');
        }
        if(handler.hasOwnProperty('exists') && handler['exists']) return;

        var formatedItem = {'name':'','type':'','group':''};
        formatedItem['buttons'] = [];
        formatedItem['bx_handler'] = ''; //url обработчика на сервисе
        formatedItem['bx_handler_id'] = '';
        formatedItem['sett_handler'] = '';
        formatedItem['plc_handler'] = ''; //код встройки в битрикс24
        formatedItem['plc_handler_url'] = ''; //урл в битрикс24
        formatedItem['app_type'] = ''; //тип удаления обработчика
        formatedItem['desc_admin'] = '';

        var hashHandler = this.getHandlerFromHash(handler);
        if(hashHandler && type === 'ALL' && hashHandler.hasOwnProperty('awz') && hashHandler.hasOwnProperty('bx')){
            type = 'ALL_LINKED';
            check_class = 'rows-smarts-'+type;
            group = $('.rows-smarts').find('.'+check_class);
        }


        if(hashHandler && hashHandler.hasOwnProperty('awz')){

            var gridParams = window.awz_helper.getGridParamsFromUrl(hashHandler['awz']['URL']);

            if(hashHandler['awz'].hasOwnProperty('PARAMS') && hashHandler['awz']['PARAMS'].hasOwnProperty('handler')){
                if(gridParams && gridParams.hasOwnProperty('1')){
                    if(!hashHandler['awz']['PARAMS']['handler'].hasOwnProperty('from') ||
                        !hashHandler['awz']['PARAMS']['handler']['from'])
                    {
                        hashHandler['awz']['PARAMS']['handler']['from'] = gridParams['1'];
                    }
                }
                if(gridParams && gridParams.hasOwnProperty('2')){
                    if(!hashHandler['awz']['PARAMS']['handler'].hasOwnProperty('to') ||
                        !hashHandler['awz']['PARAMS']['handler']['to'])
                    {
                        hashHandler['awz']['PARAMS']['handler']['to'] = gridParams['2'];
                    }
                }
            }

            ['from','to','type'].forEach(function (t){
                if(hashHandler['awz'].hasOwnProperty('PARAMS') &&
                    hashHandler['awz']['PARAMS'].hasOwnProperty('handler') &&
                    hashHandler['awz']['PARAMS']['handler'].hasOwnProperty(t)
                ){
                    formatedItem[t] = plsMan.getTitle(hashHandler['awz']['PARAMS']['handler'][t], t);
                    if(t === 'type' && !formatedItem[t] && gridParams && gridParams.hasOwnProperty('plc')){
                        formatedItem[t] = plsMan.getTitle(gridParams['plc'], t);
                    }
                }
            });

            if(hashHandler['awz'].hasOwnProperty('PARAMS') &&
                hashHandler['awz']['PARAMS'].hasOwnProperty('hook') &&
                hashHandler['awz']['PARAMS']['hook'].hasOwnProperty('desc_admin')
            ){
                formatedItem['desc_admin'] = hashHandler['awz']['PARAMS']['hook']['desc_admin'];
            }
            if(hashHandler['awz'].hasOwnProperty('PARAMS') &&
                hashHandler['awz']['PARAMS'].hasOwnProperty('handler') &&
                hashHandler['awz']['PARAMS']['handler'].hasOwnProperty('name')
            ){
                formatedItem['name'] = hashHandler['awz']['PARAMS']['handler']['name'];
            }

            if(hashHandler['awz'].hasOwnProperty('PARAMS') &&
                hashHandler['awz']['PARAMS'].hasOwnProperty('hook') &&
                hashHandler['awz']['PARAMS']['hook'].hasOwnProperty('main_menu') &&
                hashHandler['awz']['PARAMS']['hook']['main_menu'] === 'N'
            ){
                formatedItem['desc_admin'] = 'Скрыто с главного меню. '+formatedItem['desc_admin'];
            }



            if(hashHandler['awz'].hasOwnProperty('URL')){
                formatedItem['plc_handler_url'] = hashHandler['awz']['URL'];
            }
            if(hashHandler['awz'].hasOwnProperty('ID')){
                formatedItem['bx_handler_id'] = hashHandler['awz']['ID'];
            }
            if(hashHandler['awz'].hasOwnProperty('ID') &&
                hashHandler['awz'].hasOwnProperty('HASH')
            ){
                formatedItem['sett_handler'] = '&ID='+hashHandler['awz']['ID']+'&TOKEN='+hashHandler['awz']['HASH'];
            }
        }
        if(hashHandler && hashHandler.hasOwnProperty('bx')){
            if(!formatedItem['type']){
                formatedItem['type'] = plsMan.getTitleType(hashHandler['bx']['placement']);
            }
            if(!formatedItem['name']){
                formatedItem['name'] = hashHandler['bx']['langAll']['ru']['TITLE'];
            }
            if(!formatedItem['group']){
                formatedItem['group'] = hashHandler['bx']['langAll']['ru']['GROUP_NAME'];
            }
            if(hashHandler['bx']['placement'] === "REST_APP_URI"){
                formatedItem['from'] = plsMan.getTitleFrom('APP_LINK');
                formatedItem['to'] = plsMan.getTitleTo('APP_LINK');
                formatedItem['type'] = 'Встройка на приложение';
                formatedItem['desc_admin'] = 'Позволяет открывать гриды и встройки с любого места по ссылке, тип встройки: REST_APP_URI';
            }
            formatedItem['plc_handler'] = hashHandler['bx']['placement'];
            formatedItem['bx_handler'] = hashHandler['bx']['handler'];
        }
        if(!formatedItem['name']){
            //встройка битрикс
        }
        if(!formatedItem['type'] && handler.hasOwnProperty('placement')){
            formatedItem['type'] = plsMan.getTitleType(handler['placement']);
            if(!formatedItem['type']) formatedItem['type'] = handler['placement'];
        }
        if(!formatedItem['plc_handler'] && handler.hasOwnProperty('placement')){
            formatedItem['plc_handler'] = handler['placement'];
        }
        if(handler.hasOwnProperty('parent_awz')) {
            formatedItem['plc_handler_url'] = handler['handler'];
            formatedItem['bx_handler'] = '';
            formatedItem['plc_handler'] = handler['placement'];
        }

        //пользовательские поля
        if(handler && handler.hasOwnProperty('USER_TYPE_ID')) {
            formatedItem['type'] = 'Пользовательское свойство';
            formatedItem['from'] = plsMan.getTitleFrom('APP_LINK');
            formatedItem['to'] = plsMan.getTitleTo('APP_LINK');
            formatedItem['plc_handler_url'] = handler['HANDLER'];
            formatedItem['name'] = handler['TITLE'];
            formatedItem['desc_admin'] = handler['DESCRIPTION']+
                ', тип свойства: '+handler['USER_TYPE_ID'];
            formatedItem['bx_handler'] = handler['HANDLER'];
            formatedItem['app_type'] = 'app-placement';
            formatedItem['plc_handler_url'] = handler['HANDLER'];
            formatedItem['plc_handler'] = handler['USER_TYPE_ID'];
            formatedItem['sett_handler'] = handler['USER_TYPE_ID'];
            sett_handler = 'sett-userfields';
        }


        var buttons = {};
        buttons['sett_link'] = '<a href="#" ' +
            'data-app="'+$('#signed_add_form').attr('data-app')+'" ' +
            'data-domain="'+$('#signed_add_form').attr('data-domain')+'" ' +
            'data-signed="'+$('#signed_add_form').val()+'" ' +
            'data-bxhandler="'+formatedItem['sett_handler']+'" ' +
            'data-page="'+sett_handler+'" ' +
            'class="awz-handler-slide-content ui-btn ui-btn-xs ui-btn-icon-setting">' +
            '</a>';
        buttons['plc_link'] = '<a href="#" ' +
            'data-bxhandler="'+formatedItem['bx_handler']+'" ' +
            'data-type="'+formatedItem['app_type']+'" ' +
            'data-handler="'+formatedItem['plc_handler_url']+'" ' +
            'data-placement="'+formatedItem['plc_handler']+'" ' +
            'class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">' +
            'Деактивировать' +
            '</a>';
        buttons['regen_link'] = '<a href="#" ' +
            'data-handler="'+formatedItem['plc_handler_url']+'" ' +
            'data-placement="'+formatedItem['plc_handler']+'" ' +
            'class="update_smart_handled ui-btn ui-btn-xs ui-btn-danger ui-btn-icon-alert">' +
            'обновить URL' +
            '</a>';


        //var regenLink = '';//replaceHandler
        //if(!placement['bx_handler'] && placement['placement']!='REST_APP_URI'){
        //    regenLink = '<a href="#" data-handler="'+placement['handler']+'" data-placement="'+placement['placement']+'" class="update_smart_handled ui-btn ui-btn-xs ui-btn-danger ui-btn-icon-alert">обновить URL</a>'
        //    sett_link = '';
        //}

        if(formatedItem['sett_handler'] && !handler.hasOwnProperty('parent_awz')){
            formatedItem['buttons'].push('sett_link');
        }
        if((hashHandler && hashHandler.hasOwnProperty('bx')) ||
            handler.hasOwnProperty('parent_awz')
        ){
            formatedItem['buttons'].push('plc_link');
        }
        if(handler.hasOwnProperty('USER_TYPE_ID')){
            formatedItem['buttons'].push('plc_link');
        }
        if(['REST_APP_WRAP','APP_EXLINK','APP_LINK','ALL'].indexOf(type)>-1 && handler.hasOwnProperty('ID')){
            formatedItem['app_type'] = 'app-placement';
            buttons['plc_link'] = '<a href="#" ' +
                'data-id="'+handler['ID']+'" ' +
                'data-hash="'+handler['HASH']+'" ' +
                'data-type="'+formatedItem['app_type']+'" ' +
                'class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">' +
                'Удалить' +
                '</a>';
            if(formatedItem['buttons'].indexOf('plc_link')===-1)
                formatedItem['buttons'].push('plc_link');
        }

        if(hashHandler && handler.hasOwnProperty('parent_awz')){
            var ht = '';
            if(handler.hasOwnProperty('title') && handler['title']){
                formatedItem['name'] = handler['title'];
            }else if(handler.hasOwnProperty('langAll') && handler['langAll']['ru']['TITLE']){
                formatedItem['name'] = handler['langAll']['ru']['TITLE'];
            }
            ht += '<div class="row">';
            ht += '<div class="col-xs-8 no-padding-l">' +'<span class="ui-btn ui-btn-xs ui-btn-icon-share"></span>'+
                '['+formatedItem['name']+'] - '+formatedItem['type']+'</div>';
            ht += '<div class="col-xs-4 no-padding-r">';
            formatedItem['buttons'].forEach(function(btn_code){
                ht += buttons[btn_code];
            });
            ht += '</div>';
            ht += '</div>';
            $('.row-placement-'+handler['parent_awz']+' .links-bx').append(ht);
            return;
        }

        var ht = '<div class="row row-placement-'+formatedItem['bx_handler_id']+'" style="margin-bottom:10px;">';
        if(!formatedItem['from'] && !formatedItem['to'] && formatedItem.hasOwnProperty('plc_handler_url')){
            ht += '<div class="col-xs-6">' +
                '<label class="main-grid-control-label">'+formatedItem['plc_handler_url']+'</label>' +
                '</div>';
        }else{
            ht += '<div class="col-xs-3">' +
                '<label class="main-grid-control-label">'+formatedItem['from']+'</label>' +
                '</div>';
            ht += '<div class="col-xs-3 no-padding-r">' +
                '<label class="main-grid-control-label">'+formatedItem['to']+'</label>' +
                '</div>';
        }

        var add_links = '';
        if(hashHandler && hashHandler.hasOwnProperty('awz') && hashHandler['awz'].hasOwnProperty('links')){
            add_links += '<div class="container links-bx"></div>';
        }

        ht += '<div class="col-xs-6 no-padding-r">' +
            '<label class="main-grid-control-label">'+formatedItem['type']+'</label>' +add_links+
            '</div>';
        ht += '<div style="display:block;clear:both;width:100%;height:10px;"></div>';
        ht += '<div class="col-xs-3">' +
            '<label class="main-grid-control-label">'+formatedItem['name']+'</label>' +
            '</div>';
        ht += '<div class="col-xs-3">' +
            '<label class="main-grid-control-label">'+formatedItem['group']+'</label>' +
            '</div>';
        ht += '<div class="col-xs-3">' +
            '<label class="main-grid-control-label"></label>' +
            '</div>';
        ht += '<div class="col-xs-3 no-padding-r">';
        //regenLink + plc_link + sett_link;
        formatedItem['buttons'].forEach(function(btn_code){
            ht += buttons[btn_code];
        });
        ht += '</div>';

        if(formatedItem['desc_admin']){
            ht += '<div style="display:block;clear:both;width:100%;height:10px;"></div>';
            ht += '<div class="col-xs-12">';
            ht += formatedItem['desc_admin'];
            ht += '</div>';
        }

        ht += '</div>';
        $('.rows-smarts .'+check_class).append(ht);
        if(hashHandler && hashHandler.hasOwnProperty('bx')){
            hashHandler['bx']['exists'] = 1;
        }
        //console.log(formatedItem, hashHandler, handler);
    },
    createInputRow: function(id){
        var next = $('#'+id).attr('data-nextraw');
        var html = $('#'+id).next().html();
        html = html.replace('name=""', 'name="'+next+'"');
        html = html.replace('name="_currency"', 'name="'+next+'_currency"');
        html = '<div class="wrp_awz_add_input">'+html+'</div>';
        $('#'+id).attr('data-nextraw', parseInt(next)+1);
        $('#'+id).parent('.main-grid-editor-custom').find('.wrp_awz_add_input_block').append(html);
    },
    setMultiselectItems: function(targetNode){
        try{
            var items = this.dialog_openMultiselect.getSelectedItems();
        }catch (e) {
            console.log(e);
        }
        var values = [];
        items.forEach(function(itm){
            if(itm.hasOwnProperty('id') && itm.id && values.indexOf(itm.id)===-1)
                values.push(itm.id);
        });
        $('#value_entry_control').val(values.join(','));
        //console.log(items, targetNode);
    },
    openMultiselect: function(btn){
        if(!this.hasOwnProperty('dialog_openMultiselect')){
            this.dialog_openMultiselect = null;
        }
        if(this.dialog_openMultiselect) {
            try{
                this.dialog_openMultiselect.destroy();
            }catch (e) {

            }
            this.dialog_openMultiselect = null;
        }
        var node = $('#'+btn);
        var params = node.attr('data-onchange');
        eval("var data = "+params+';');
        //console.log(data);
        var parent = this;
        try{
            this.dialog_openMultiselect = new BX.UI.EntitySelector.Dialog({
                targetNode: document.getElementById('value_entry'),
                cacheable: false,
                enableSearch: false,
                dropdownMode: true,
                multiple: true,
                focusOnFirst: false,
                compactView: true,
                items: data[0]['VALUES'],
                tabs: data[0]['TAB'],
                events: {
                    'Item:onSelect':function(e){
                        parent.setMultiselectItems(e.getTarget());
                    },
                    'Item:onDeselect':function(e){
                        parent.setMultiselectItems(e.getTarget());
                    },
                    onFirstShow: function(e){
                        /*try{
                            var dialog = e.getTarget();
                            data[0]['VALUES'].forEach(function(itm){
                                console.log(itm);
                                dialog.addItem(itm);
                            });
                        }catch (e) {
                            console.log(e);
                        }*/
                    }
                }
            });
            this.dialog_openMultiselect.show();
        }catch (e) {
            console.log(e);
        }

        /*
        * this.dialog = new BX.UI.EntitySelector.Dialog({
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
        * */
    },
    getGrid: function(){
        if(!this.hasOwnProperty('grid_ob')){
            this.grid_ob = null;
        }
        if(this.grid_ob) return this.grid_ob;
        try{
            this.grid_ob = window.awz_helper.grid_ob.getParent();
        }catch (e) {
            try{
                this.grid_ob = BX.Main.gridManager.getById(window.awz_helper.gridId).instance;
            }catch (e) {
                console.log(e);
            }
        }
        return this.grid_ob;
    },
    showPreloaderGrid: function(){
        //console.log('showPreloaderGrid', this.getGrid().getLoader());
        this.getGrid().getLoader().show();
        this.getGrid().tableFade();
    },
    hidePreloaderGrid: function(){
        //console.log('hidePreloaderGrid', this.getGrid().getLoader());
        this.getGrid().getLoader().hide();
        this.getGrid().tableUnfade();
        var parent = this;
        var count_hidePreloaderGrid = 0;
        var timer_hidePreloaderGrid = setInterval(function(){
            count_hidePreloaderGrid += 1;
            if(count_hidePreloaderGrid>10){
                clearInterval(timer_hidePreloaderGrid);
                return;
            }
            if($('.main-grid-table-fade').height()){
                parent.getGrid().getLoader().hide();
                parent.getGrid().tableUnfade();
                console.log('grid unfaded', $('.main-grid-table-fade').height());
                clearInterval(timer_hidePreloaderGrid);
                return;
            }
        },500);
    },
    addErrorB: function(p_err){
        var title = '';
        var text = '';
        if(p_err.hasOwnProperty('error') &&
            window.AwzBx24Proxy.util_type.isString(p_err['error'])
        ){
            title = p_err['error'];
        }
        if(p_err.hasOwnProperty('error_description') &&
            window.AwzBx24Proxy.util_type.isString(p_err['error_description'])
        ){
            text = p_err['error_description'];
        }
        return this.addError(title, text);
    },
    addError: function(title, errorText, err){
        if(err){
            console.log(err);
            try{
                errorText += err.message;
            }catch (e) {

            }
        }else{
            console.log([title, errorText]);
        }
        this.errors.push({
            'TYPE': 'ERROR',
            'TITLE': title,
            'TEXT': errorText
        });
        return true;
    },
    showError: function(){
        if(!this.errors.length) return;
        try{
            this.hidePreloaderGrid();
            this.getGrid().arParams['MESSAGES'] = this.errors;
            this.getGrid().messages.show();
            this.errors = [];
        }catch (e) {
            console.log(e);
        }
    },
    checkRespError:function(data){
        var k;
        var title = '';
        var text = '';
        var parent = this;

        try{
            if(window.AwzBx24Proxy.util_type.isArray(data)){
                res_err = false;
                data.forEach(function(row){
                    if(window.AwzBx24Proxy.util_type.isObjectNoAr(row) &&
                        row.hasOwnProperty('answer')
                    ){
                        if(window.AwzBx24Proxy.util_type.isObjectNoAr(row['answer']) &&
                            row['answer'].hasOwnProperty('error') &&
                            window.AwzBx24Proxy.util_type.isObjectNoAr(row['answer']['error'])
                        ){
                            res_err = parent.addErrorB(row['answer']['error']);
                        }
                    }
                });
                return res_err;
            }else if(window.AwzBx24Proxy.util_type.isObjectNoAr(data)){
                if(data.hasOwnProperty('statusText')){
                    title = data.statusText;
                    if(data.hasOwnProperty('status')){
                        if(!title) title += ' ';
                        title += data.status;
                    }
                    if(data.hasOwnProperty('responseText')){
                        text = data.responseText;
                        try{
                            var jsn = JSON.parse(data.responseText);
                            if(parent.uTypes.isObjectNoAr(jsn)){
                                if(jsn.hasOwnProperty('error')){
                                    title = jsn['error'];
                                }
                                if(jsn.hasOwnProperty('error_description')){
                                    text = jsn['error_description'];
                                }
                            }
                        }catch (e) {

                        }
                    }
                    return this.addError(title, text);
                }else if(data.hasOwnProperty('status') && data['status'] === 'error'){
                    if(data.hasOwnProperty('errors')){
                        for(k in data['errors']){
                            var err = data['errors'][k];
                            if(window.AwzBx24Proxy.util_type.isObjectNoAr(err)){
                                if(err.hasOwnProperty('code')){
                                    title += err.code;
                                }
                                if(err.hasOwnProperty('status')){
                                    if(!title) title += ' ';
                                    title += err.status;
                                }
                                if(err.hasOwnProperty('message')){
                                    text += err.message;
                                }
                            }
                        }
                    }
                    return this.addError(title, text);
                }
                if(data.hasOwnProperty('result') &&
                    window.AwzBx24Proxy.util_type.isObjectNoAr(data['result'])
                ){
                    if(data['result'].hasOwnProperty('result_error') &&
                        window.AwzBx24Proxy.util_type.isObjectNoAr(data['result']['result_error'])
                    ){
                        var res_err = false;
                        for(k in data['result']['result_error']){
                            var p_err = data['result']['result_error'][k];
                            if(window.AwzBx24Proxy.util_type.isObjectNoAr(p_err)){
                                res_err = parent.addErrorB(p_err);
                            }
                        }
                        return res_err;
                    }
                }
            }
        }catch (e) {
            console.log(e);
        }
        return false;
    },
    addTimes: function(method, res){
        if(!this.times) this.times = {};
        if(!this.times.hasOwnProperty(method)){
            this.times[method] = {
                'time':0,
                'end':0,
                'lock':0
            };
        }
        let checking_ob = [];
        if(res.hasOwnProperty('result')){
            if(res['result'].hasOwnProperty('result') && res['result'].hasOwnProperty('result_error') && res['result'].hasOwnProperty('result_time')){
                if(this.uTypes.isObject(res['result']['result_time'])){
                    checking_ob = res['result']['result_time'];
                }
            }else if(res.hasOwnProperty('time') && this.uTypes.isObject(res['time'])){
                checking_ob = [res['time']];
            }
        }
        let k;
        for(k in checking_ob){
            let itm = checking_ob[k];
            if(this.uTypes.isObject(itm) && itm.hasOwnProperty('processing') &&
                this.times[method]['time'] < itm['operating']
            )
            {
                this.times[method]['time'] = itm['operating'];
            }
            if(this.uTypes.isObject(itm) && itm.hasOwnProperty('operating_reset_at') &&
                this.times[method]['end'] < itm['operating_reset_at']
            )
            {
                this.times[method]['end'] = itm['operating_reset_at'];
            }
        }
        if(this.times[method]['time']>this.maxMethodTime){
            this.times[method]['lock'] = this.times[method]['end']+60;
        }
        console.log('addTimes', method, res);
    },
    isLockTimes: function(){
        if(!this.times) this.times = {};
        let method;
        for(method in this.times){
            let itm = this.times[method];
            if(itm['lock']){
                let date = new Date(itm['lock']*1000);
                return date > new Date() ? date : false;
            }
        }
        return false;
    },
    setLimitsTextPreloader: function(preloader){
        if(!preloader) preloader = this.timeouts_preloader;
        if(!this.times) this.times = {};
        let txt = '';
        let method;
        for(method in this.times){
            let itm = this.times[method];
            if(!itm['time']) continue;
            if(txt) txt+='<br>';
            let num = 1;
            if(itm['time']<10) num = 10;
            if(itm['time']<1) num = 100;
            txt += method+': '+(Math.round(itm['time']*num)/num).toString()+' сек. из '+this.maxMethodTime;
            if(itm['end']){
                txt += ' до '+(new Date(itm['end']*1000)).toLocaleTimeString();
            }
        }
        let tBefore = $(preloader.getTextBefore());
        if(tBefore.find('.awz-all-methods').length===0){
            tBefore.append('<div class="awz-all-methods" style="clear:both;"></div>');
            tBefore.append('<div class="awz-all-methods-lock" style="clear:both;"></div>');
        }
        tBefore.find('.awz-all-methods').html(txt);
        let date = this.isLockTimes();
        //if(!date) date = new Date();
        if(date){
            let diff = (date - new Date())/1000;
            let diff_m = Math.floor(diff/60);
            let diff_s = Math.floor(diff) - diff_m*60;
            diff_m = diff_m.toString();
            diff_s = diff_s.toString();
            tBefore.find('.awz-all-methods-lock').html('' +
                '<b style="color:red;">API заблокированно до: ' +date.toLocaleTimeString()+
                '</b><br>До освобождения лимитов: '+diff_m+' мин. '+diff_s+' сек.');

        }
        preloader.setTextBefore(tBefore.html());
        //preloader.update(preloader.value);
    },
    checkLockTimes: function(preloader){
        let parent = this;
        return new Promise((resolve, reject) => {
            if(!parent.isLockTimes()) {
                parent.setLimitsTextPreloader(preloader);
                resolve();
                return;
            }
            const handleInterval = function(){
                if(!parent.isLockTimes()){
                    parent.setLimitsTextPreloader(preloader);
                    resolve();
                    clearInterval(interval);
                }
            };
            const interval = setInterval(handleInterval, 800);
        });
    },
    getGridOptions: function(){
        return window.awz_helper.gridOptions;
    },
    getItemsIds:function(params){
        var parent = this;
        return new Promise((resolve, reject) => {

            if(typeof params[0] != 'object') return resolve(params);
            if(params.length>50) {
                return reject(new Error("Запрошено больше 2500 элементов"));
            }

            var batch = [];
            var k;
            var lastMethod = '';
            for(k in params){
                batch.push({
                    'method':params[k][0],
                    'params':params[k][1]
                });
                lastMethod = params[k][0];
            }
            setTimeout(function(){
                window.AwzBx24Proxy.callBatch(batch, function(res)
                    {
                        parent.addTimes(lastMethod, window.awz_nhelper.last_resp);
                        window.awz_helper.addBxTime(res);
                        var items = [];
                        batch.forEach(function(itm, index){
                            if(res.hasOwnProperty(index)){
                                var tmp_res = res[index];
                                var items_key = 'items';
                                if(window.awz_helper.hasOwnProperty('gridOptions')){
                                    items_key = window.awz_helper.gridOptions['result_key'];
                                }
                                if(items_key === '-'){
                                    var tmp = Object.assign({}, tmp_res);
                                    delete tmp_res.result;
                                    tmp_res = Object.assign({}, tmp_res);
                                    tmp_res['result'] = {'items': tmp};
                                    items_key = 'items';
                                }
                                if(tmp_res.hasOwnProperty('result')){
                                    var k;
                                    for(k in tmp_res.result[items_key]){
                                        var tmp_item = tmp_res.result[items_key][k];
                                        if(tmp_item.hasOwnProperty('ID')){
                                            items.push(tmp_item['ID']);
                                        }else if(tmp_item.hasOwnProperty('id')){
                                            items.push(tmp_item['id']);
                                        }
                                    }
                                }
                            }
                        });
                        if(items.length){
                            return resolve(items);
                        }
                        return reject(new Error("Элементы не найдены"));
                    }, false, null, true
                );
            },500);

        });
    },
    batchArray: function(arr, max){
        if(!max) max = 50;
        var items = [];
        var lastKey = 0;
        var k;
        for(k in arr){
            var itm = arr[k];
            if(items.length<=lastKey) items.push([]);
            if(items[lastKey].length>=max){
                lastKey+=1;
                items.push([]);
            }
            items[lastKey].push(itm);
        }
        return items;
    },
    createBatchDelete: function(data){
        if(this.uTypes.isArray(data)){
            data = {'ID':data};
        }
        const gridOptions = this.getGridOptions();
        const smartId = window.awz_helper.smartId;
        let k;
        let batch = [];
        for(k in data['ID']){
            if(
                ['EXT_TASK_USER','TASK_USER']
                    .indexOf(gridOptions.PARAM_1)>-1
            ){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'taskId':data['ID'][k]
                    }
                });
            }else if(gridOptions.PARAM_1 === 'EXT_TASK_USER'){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'taskId':data['ID'][k]
                    }
                });
            }else if(['DOCS','COMPANY','CONTACT',
                'DEAL','LEAD','EXT_COMPANY','EXT_CONTACT','EXT_DEAL','EXT_LEAD',
                'DOCS_CRM','WORKS'].indexOf(gridOptions.PARAM_1)>-1)
            {
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'id':data['ID'][k]
                    }
                });
            }else if(gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'id':data['ID'][k]
                    }
                });
            }else if(gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'entityTypeId':smartId,
                        'id':data['ID'][k]
                    }
                });
            }else if(gridOptions.PARAM_1.indexOf('RPA_')>-1){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'typeId':smartId,
                        'id':data['ID'][k]
                    }
                });
            }else if(gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1){
                batch.push({
                    'method':gridOptions.method_delete,
                    'params':{
                        'IBLOCK_TYPE_ID':'lists',
                        'IBLOCK_ID':smartId,
                        'ELEMENT_ID':data['ID'][k]
                    }
                });
            }

        }
        if(this.debug)
            console.log('createBatchDelete', data, batch);
        return batch;
    },
    canselGroupActions: function(){
        this.timeouts_cansel = true;
        window.awz_helper.clearTimeouts();
        window.awz_helper.prepared_ids = false;
        window.awz_helper.clearTimeoutsVariables();
        window.awz_helper.reloadList();
    },
    applyGroupButton:function(action){
        let parent = this;
        window.awz_nhelper.showPreloaderGrid();
        let actionId = $('#base_action_select_control').attr('data-value');
        let field_up_id = actionId.replace("control_ef_","");
        let field_type = '';
        if(field_up_id === 'bp')
            field_type = 'bp';
        if(field_up_id === 'delete')
            field_type = 'delete';
        if(field_up_id === 'copy')
            field_type = 'copy';
        if(parent.debug)
            console.log('applyGroupButton field_type', field_type);
        if(['bp','delete','copy'].indexOf(field_type)===-1) return;

        let value = $('#value_entry_control').val();
        if(!value)
            value = $('#value_entry_control').attr('data-value');
        if(!value) value = '';
        let check_all = $('#apply_button_for_all_control').is(':checked');

        let tmp_vars = window.awz_helper.prepareGroupListParams();
        let batch_prepare = [];
        let method = tmp_vars[0];
        let params = tmp_vars[1];
        let check_order_upper = tmp_vars[2];
        let check_add_upper = tmp_vars[3];
        window.awz_helper.clearTimeoutsVariables();

        let text_before = "<b>Запуск БП</b>";
        if(field_type==='delete'){
            text_before = '<b>Удаление элементов</b>';
        }else if(field_type==='copy'){
            text_before = '<b>Копирование элементов</b>';
        }
        text_before += ' <a class="close_ids_change" href="#">остановить</a>';

        let max_start_cnt = window.awz_helper.pagesize_total;
        let ids_el = [];
        if(field_type === 'copy'){
            if(!value) value = 1;
            ids_el = window.awz_helper.grid_ob.getParent().getRows().getSelectedIds();
            max_start_cnt = ids_el.length * parseInt(value);
        }

        parent.timeouts_cansel = false;
        parent.timeouts_preloader = new BX.UI.ProgressBar({
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
        $('#'+window.awz_helper.gridId+'_bottom_panels').append(
            parent.timeouts_preloader.getContainer()
        );
        window.awz_helper.resize();

        parent.intervals_turn = [];
        if(check_all){
            let step = 50;
            for(var k=0; k < (window.awz_helper.pagesize_total/step); k++){
                let params_copy = Object.assign({},params);
                params_copy['start'] = step*k;
                if(check_order_upper){
                    params_copy['order']['ID'] = 'ASC';
                }else{
                    params_copy['order']['id'] = 'ASC';
                }
                var ob_tmp = {
                    'FIELDS':{}
                };
                ob_tmp['FIELDS'][field_up_id] = value;
                parent.intervals_turn.push([
                    method, params_copy,
                    ob_tmp
                ]);
            }
        }else{
            parent.intervals_turn = window.awz_helper.grid_ob.getParent().getRows().getSelectedIds();
            if(field_type !== 'copy'){
                parent.timeouts_preloader.setMaxValue(parent.intervals_turn.length);
            }
        }

        const load_pop = function(batchs)
        {
            const interval = setInterval(function(){
                parent.setLimitsTextPreloader(parent.timeouts_preloader)
            }, 1000);
            parent.checkLockTimes(parent.timeouts_preloader).then(function(){
                clearInterval(interval);
                parent.setLimitsTextPreloader(parent.timeouts_preloader)
                if(!batchs.length || parent.timeouts_cansel) {
                    parent.hidePreloaderGrid();
                    window.awz_helper.getSmartData();
                    parent.timeouts_cansel = false;
                    return;
                }
                parent.showPreloaderGrid();
                let batch_pop = batchs.pop();
                if(parent.debug)
                    console.log('load_pop','batch_pop',batch_pop);
                window.AwzBx24Proxy.callBatch(batch_pop, function(res){
                    if(parent.debug)
                        console.log('batch_pop callback',res);
                    if(field_type === 'bp'){
                        parent.addTimes('bizproc.workflow.start', window.awz_nhelper.last_resp);
                    }else if(field_type === 'delete'){
                        parent.addTimes(parent.getGridOptions()['method_delete'], window.awz_nhelper.last_resp);
                    }else if(field_type === 'copy'){
                        parent.addTimes(parent.getGridOptions()['method_add'], window.awz_nhelper.last_resp);
                    }
                    parent.timeouts_preloader.update(
                        parent.timeouts_preloader.value + res.length
                    );
                    setTimeout(function(){
                        load_pop(batchs);
                    },3000);
                },false, null, true);
            });
        };

        if(field_type === 'copy'){
            let copy_items_batch = [];
            let params_copy = Object.assign({},params);
            params_copy['start'] = 0;
            if(check_order_upper){
                params_copy['order']['ID'] = 'ASC';
            }else{
                params_copy['order']['id'] = 'ASC';
            }
            params_copy['filter'] = {};
            params_copy['select'] = Object.keys(window.awz_helper.fields);
            params_copy['filter'][params_copy['select'][0]] = ids_el;
            window.AwzBx24Proxy.callApi(method, params_copy,function(res){
                parent.addTimes(method, res);
                parent.setLimitsTextPreloader(parent.timeouts_preloader);

                let items_key = 'items';
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
                    let items = [];
                    items = res.result[items_key];
                    window.awz_helper.temp_items = items;
                    let kol, k;
                    let batch = [];
                    for(k in items){
                        let item = items[k];
                        let prm = {};
                        if(check_add_upper){
                            let converted = {};
                            let k2;
                            for(k2 in item){
                                if(window.awz_helper.fields.hasOwnProperty(k2) && window.awz_helper.fields[k2].hasOwnProperty('upperCase')){
                                    converted[window.awz_helper.fields[k2].upperCase] = item[k2];
                                }
                            }
                            prm = {'fields':converted};
                        }else{
                            prm = {'fields':item};
                            if(params.hasOwnProperty('entityTypeId')){
                                prm['entityTypeId'] = params['entityTypeId'];
                            }
                            if(params.hasOwnProperty('typeId')){
                                prm['typeId'] = params['typeId'];
                            }
                            if(params.hasOwnProperty('IBLOCK_ID')){
                                prm['IBLOCK_ID'] = params['IBLOCK_ID'];
                            }
                            if(params.hasOwnProperty('IBLOCK_TYPE_ID')){
                                prm['IBLOCK_TYPE_ID'] = params['IBLOCK_TYPE_ID'];
                                prm['ELEMENT_CODE'] = '';
                            }
                        }
                        if(prm.fields.hasOwnProperty('id')){
                            delete prm.fields['id'];
                        }
                        if(prm.fields.hasOwnProperty('ID')){
                            delete prm.fields['ID'];
                        }
                        for(kol=1; kol <= value; kol++){
                            if(parent.getGridOptions()['method_add'] === 'lists.element.add'){
                                prm['ELEMENT_CODE'] = new Date().getTime()+'_'+Math.floor(Math.random() * 8)+'_'+kol+'_'+k;
                            }
                            batch.push({
                                'method': parent.getGridOptions()['method_add'],
                                'params': Object.assign({}, prm)
                            });
                        }
                    }
                    load_pop(parent.batchArray(batch, 50));
                }else{
                    parent.hidePreloaderGrid();
                }
            });
        }else{
            this.getItemsIds(parent.intervals_turn).then(function(ids_){
                let batchIds = parent.batchArray(ids_, 50);
                let k;
                let batchs = [];
                for(k in batchIds){
                    let ids = batchIds[k];
                    let batch = [];

                    if(field_type === 'bp'){
                        ids.forEach(function(id){
                            var prep = value.split(",");
                            prep[3] = prep[3].replace('#ID#',id);
                            batch.push({
                                'method':'bizproc.workflow.start',
                                'params':{
                                    'DOCUMENT_ID':[prep[1],prep[2],prep[3]],
                                    'TEMPLATE_ID':prep[0]
                                }
                            });
                        });
                        batchs.push(batch);
                    }else if(field_type === 'delete'){
                        batchs.push(parent.createBatchDelete(ids));
                    }
                }
                load_pop(batchs);
            }).catch(function(err){
                parent.hidePreloaderGrid();
                parent.getGrid().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': 'Ошибка',
                    'TEXT': err.message
                }];
                parent.getGrid().messages.show();
            });
        }

    }
};

$(document).ready(function (){

    window.awz_helper = {
        canselGroupActions: function(){
            return window.awz_nhelper.canselGroupActions();
        },
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
            //console.log('set resize');
            try{
                if(window.awz_nhelper.plcInfoGet('placement') === 'USERFIELD_TYPE'){
                    BX24.resizeWindow(document.body.clientWidth,
                        document.getElementsByClassName("ui-block-content")[0].clientHeight);
                    return;
                }
            }catch (e) {
                console.log(e);
            }
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
            if(!window.AwzBx24PlacementManager_ob){
                window.AwzBx24EntityLoader_ob.setHookListDinamic();
                window.AwzBx24PlacementManager_ob = new AwzBx24PlacementManager;
                window.AwzBx24PlacementManager_ob.init({
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
                            'value':'TASK_VIEW_TAB',
                            'title':'Вкладка в форме просмотра задачи',
                            'data-code':'TASK_VIEW_TAB'
                        },
                        {
                            'value':'REST_APP_URI',
                            'title':'Ссылка на приложение с параметрами',
                            'data-code':'REST_APP_URI'
                        },
                        {
                            'value':'REST_APP_USERFIELD',
                            'title':'Пользовательское поле: Универсальная сущность',
                            'data-code':'REST_APP_USERFIELD'
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

                        if(from == 'TASK_USER_CRM') return false;
                        if(from == 'TASK_GROUPS') return false;
                        if(from == 'TASK_GROUP') return false;

                        if(option.value === 'REST_APP_URI'){
                            if(from === 'APP_LINK' && to === 'APP_LINK'){
                                return false;
                            }
                            return true;
                        }
                        if(from === 'APP_LINK'){
                            if(to === 'APP_LINK' && option.value === 'REST_APP_URI'){
                                return true;
                            }
                            /*
                            if(to === 'APP_LINK' && option.value === 'REST_APP_USERFIELD'){
                                return true;
                            }*/
                            if(to === 'APP_LINK' && option.value === 'REST_APP_WRAP'){
                                return true;
                            }
                            return false;
                        }else if(to === 'APP_LINK' && option.value === 'REST_APP_URI'){
                            return true;
                        }else if(to === 'APP_LINK'){
                            return false;
                        }
                        if(from === 'APP_EXLINK'){
                            if(to === 'APP_LINK' && option.value === 'REST_APP_URI'){
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
                            if(['TASK_VIEW_TAB','TASK_USER_LIST_TOOLBAR'].indexOf(option.value)>-1) {
                                return true;
                            }
                        }
                        if(['GROUP'].indexOf(to)>-1){
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
                        }else if(from === 'APP_EXLINK'){
                            $('#placement-sett-manager-to').find('option').each(function(){
                                if($(this).attr('value') && $(this).attr('value')!=='APP_LINK') $(this).remove();
                            });
                        }else{
                            $('#placement-sett-manager-to').find('option').each(function(){
                                //if($(this).attr('value') && $(this).attr('value')==='APP_LINK') $(this).remove();
                                if($(this).attr('value') && $(this).attr('value')==='WORKS') $(this).remove();
                            });
                        }
                        $('#placement-sett-manager-to').find('option').each(function(){
                            if($(this).attr('value') && $(this).attr('value')==='TASK_USER_CRM') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_TASK_USER') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_COMPANY') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_CONTACT') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_DEAL') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_LEAD') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='DOCS_CRM') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='TASK_GROUPS') $(this).remove();
                        });
                        if(from && from.indexOf('EXT_TASK_USER')>-1){
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
                        }else if(type === 'REST_APP_USERFIELD' && from === 'APP_LINK'){
                            name = 'Универсальная сущность';
                            BX24.callMethod(
                                'userfieldtype.add',
                                {
                                    'USER_TYPE_ID': 'awzuientity',
                                    'HANDLER': window.awz_helper.APP_URL+'uientity.php?app='+window.awz_helper.APP_ID,
                                    'TITLE': name,
                                    'DESCRIPTION': 'Позволяет встраивать выбор и отображение CRM сущности',
                                    'OPTIONS':{'height':27}
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
                            }else if(smart === 'LEAD'){
                                url_code = 'lead';
                            }else if(smart === 'TASK_USER'){
                                url_code = 'task';
                            }else if(smart === 'TASK_USER_CRM'){
                                url_code = 'task';
                            }else if(smart === 'TASK_GROUPS'){
                                url_code = 'task';
                            }else if(smart.indexOf('TASK_GROUP_')>-1){
                                url_code = 'task';
                            }else if(smart.indexOf('LISTS_LISTS_')>-1){
                                url_code = 'lists';
                            }else if(smart.indexOf('EXT_TASK_USER_')>-1){
                                url_code = 'task';
                            }else if(smart.indexOf('EXT_COMPANY_')>-1){
                                url_code = 'cmp';
                            }else if(smart.indexOf('EXT_CONTACT_')>-1){
                                url_code = 'cont';
                            }else if(smart.indexOf('EXT_DEAL_')>-1){
                                url_code = 'deal';
                            }else if(smart.indexOf('EXT_LEAD_')>-1){
                                url_code = 'lead';
                            }else if(smart.indexOf('EXT_AWZORM_')>-1){
                                url_code = 'orm';
                            }else if(smart.indexOf('RPA_')>-1){
                                url_code = 'rpa';
                            }
                            if(smart_to === 'DOCS') smart_to = '';
                            if(type === 'REST_APP_WRAP') url_code = 'index';
                            if(from === 'APP_EXLINK' && type === 'REST_APP_URI') url_code = 'index';

                            //console.log('placement_add', from, to, type, url_code);

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
                            }else if(smart.indexOf('EXT_LEAD_')>-1){
                                grid_key += '1_EXT_LEAD__2_'+smart_to;
                            }else if(smart.indexOf('EXT_AWZORM_')>-1){
                                grid_key += '1_'+smart.replace(/_e_.*/g,"")+'__2_'+smart_to;
                            }else if(smart.indexOf('EXT_RPA_')>-1){
                                grid_key += '1_'+smart.replace(/_e_.*/g,"")+'__2_'+smart_to;
                            }else if(smart.indexOf('EXT_LISTS_LISTS_')>-1){
                                grid_key += '1_'+smart.replace(/_e_.*/g,"")+'__2_'+smart_to;
                            }else if(smart.indexOf('EXT_DYNAMIC_')>-1){
                                grid_key += '1_'+smart.replace(/_e_.*/g,"")+'__2_'+smart_to;
                            }else{
                                grid_key += '1_'+smart+'__2_'+smart_to;
                            }
                            if(userId){
                                grid_key += '__u_'+userId;
                            }
                            url = window.awz_helper.APP_URL+
                                url_code+
                                'n.php?plc='+placement+
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
                                smart.indexOf('EXT_LEAD_')>-1 ||
                                smart.indexOf('EXT_AWZORM_')>-1 ||
                                smart.indexOf('EXT_RPA_')>-1 ||
                                smart.indexOf('EXT_DYNAMIC_')>-1 ||
                                smart.indexOf('EXT_LISTS_LISTS_')>-1
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
            return window.AwzBx24PlacementManager_ob;
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
                opts['plc'] = opts['plc'];
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
                        console.log(e);
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
                            if(plc.hasOwnProperty('MENU') && plc['MENU']!='Y') continue;
                            if(plc.hasOwnProperty('DESC') && plc['DESC']){
                                plc['NAME'] += '<i>'+plc['DESC']+'</i>';
                            }
                            var hookUrl = '/marketplace/view/'+window.awz_helper.MARKET_ID+'/?params[HOOK]='+plc['ID'];
                            var plc_type = 'placement'; //не парсит урл
                            if(plc.hasOwnProperty('MLINK')){
                                hookUrl = plc['MLINK'];
                            }
                            $('.appWrapPlaceList .row-items-active').append(
                                '<div class="item" style="background:'+plc['BG']+';"><a class="open-smart" data-ent="'+plc_type+'" href="'+hookUrl+'">' +
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

            var hideSett = false;
            if(window.awz_nhelper.plcInfoGet('HOOK')){
                hideSett = true;
            }
            if(parentPlacement){
                hideSett = true;
            }

            if(!BX24.isAdmin() || hideSett){
                this.pagesManager.hidePages();
                if(!hideSett){
                    this.pagesManager.showMessage('<div class="ui-alert ui-alert-danger">Добавление встроек доступно только администратору портала</div>');
                }
                return;
            }
            window.awz_helper.add_loader($('.appWrap'), 'Загрузка списка сущностей');

            var placementManager = this.getPlacementManager();
            placementManager.show();

            placementManager.appendFrom({
                'value':'APP_LINK',
                'title':'Приложение'
            });
            placementManager.appendFrom({
                'value':'APP_EXLINK',
                'title':'Стороннее приложение'
            });
            placementManager.appendTo({
                'value':'APP_LINK',
                'title':'Битрикс24'
            });

            //crm.type.list
            var findIdsSmart = [];
            var findIdsRpa = [];
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
                'EXT_LEAD':{
                    'title': 'Лиды (внешние)'
                },
                'TASK_USER':{
                    'title': 'Задачи'
                },
                'EXT_TASK_USER':{
                    'title': 'Задачи (внешние)'
                },
                /*'TASK_USER_CRM':{
                    'title': 'Задачи CRM сущности'
                },
                'TASK_GROUPS':{
                    'title': 'Задачи группы'
                },*/
                'DOCS':{
                    'title': 'Документы'
                },
                /*'DOCS_CRM':{
                    'title': 'Документы CRM сущности'
                },*/
                'GROUP':{
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


            window.awz_nhelper.getEntityForPlacement().then((iters)=>{
                console.log('iters', iters);
                $('.rows-smarts').html('');
                $('.rows-ext-smarts').html('');
                var ext_hooks = [];

                //список смартов
                try {
                    if(iters['crm_type']){
                        var k;
                        for (k in iters['crm_type']) {
                            var item = iters['crm_type'][k];
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

                            placementManager.all_placements['CRM_'+'DYNAMIC_'+item.entityTypeId+'_DETAIL_TAB'] = 'Пункт в табе в карточке ('+item.title+')';
                            placementManager.all_placements['CRM_'+'DYNAMIC_'+item.entityTypeId+'_DETAIL_ACTIVITY'] = 'Пункт в меню таймлайна ('+item.title+')';
                            placementManager.all_placements['CRM_'+'DYNAMIC_'+item.entityTypeId+'_DETAIL_TOOLBAR'] = 'Пункт в списке приложений карточки ('+item.title+')';
                            placementManager.all_placements['CRM_'+'DYNAMIC_'+item.entityTypeId+'_LIST_TOOLBAR'] = 'Кнопка около Роботов в списке ('+item.title+')';
                            placementManager.all_placements['CRM_'+'DYNAMIC_'+item.entityTypeId+'_DOCUMENTGENERATOR_BUTTON'] = 'Кнопка в документах ('+item.title+')';
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                //список RPA
                try {
                    if(iters['rpa_type']){
                        var k;
                        for (k in iters['rpa_type']) {
                            var item = iters['rpa_type'][k];
                            findIdsRpa.push(item.id);
                            item.title = 'RPA: '+item.title;
                            //linksSmart[item.entityTypeId] = item;
                            linksSmart['RPA_'+item.id] = item;

                            placementManager.appendFrom({
                                'value':'RPA_'+item.id,
                                'title':item.title
                            });

                        }
                    }
                } catch (e) {
                    console.log(e);
                }


                //список групп
                try {
                    if(iters['sonet_group']){
                        var k;
                        for (k in iters['sonet_group']) {
                            var item = iters['sonet_group'][k];
                            item.title = 'Задачи в группе: '+item.NAME;
                            item.entityTypeId = item.ID;
                            linksSmart['group_'+item.entityTypeId] = item;
                            linksSmart['TASK_GROUP_'+item.entityTypeId] = item;

                            /*placementManager.appendFrom({
                                'value':'TASK_GROUP_'+item.entityTypeId,
                                'title':item.title
                            });*/
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                //список групп
                try {
                    if(iters['lists_lists']){
                        var k;
                        for (k in iters['lists_lists']) {
                            var item = iters['lists_lists'][k];
                            //console.log(item);
                            item.title = 'УС: '+item.NAME;
                            item.entityTypeId = item.ID;
                            linksSmart['lists_lists_'+item.entityTypeId] = item;
                            linksSmart['LISTS_LISTS_'+item.entityTypeId] = item;
                            placementManager.appendFrom({
                                'value':'LISTS_LISTS_'+item.entityTypeId,
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
                    'value':'LEAD',
                    'title':linksSmart['LEAD'].title
                });
                /*placementManager.appendFrom({
                    'value':'DOCS_CRM',
                    'title':linksSmart['DOCS_CRM'].title
                });*/
                placementManager.appendFrom({
                    'value':'TASK_USER',
                    'title':linksSmart['TASK_USER'].title
                });
                /*placementManager.appendFrom({
                    'value':'TASK_GROUPS',
                    'title':linksSmart['TASK_GROUPS'].title
                });
                placementManager.appendFrom({
                    'value':'TASK_USER_CRM',
                    'title':linksSmart['TASK_USER_CRM'].title
                });*/



                //внешние сущности
                try {
                    if(iters['user_option']){
                        var k;
                        for (k in iters['user_option']) {
                            var item = iters['user_option'][k];
                            var extItem = item.split('---');
                            var k_ext = k;
                            var portal = extItem[1].replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            if(portal.indexOf('/bitrix/services/main/ajax.php')>-1){
                                portal = extItem[1].replace(/.*\/(.*)\/bitrix\/.*/g," - $1");
                            }

                            var append = false;
                            var title = extItem[0];
                            var url_title = extItem[1].replace(/.*\/(.*\/rest\/[0-9]+\/[a-z0-9]{3}).*/g,"$1...");
                            if(extItem[0] === 'task'){
                                placementManager.appendFrom({
                                    'value':'EXT_TASK_USER_'+k_ext,
                                    'title':linksSmart['EXT_TASK_USER'].title + portal,
                                    'data-code':item+'---'+k_ext
                                });
                                title = linksSmart['EXT_TASK_USER'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'company'){
                                placementManager.appendFrom({
                                    'value':'EXT_COMPANY_'+k_ext,
                                    'title':linksSmart['EXT_COMPANY'].title + portal,
                                    'data-code':item+'---'+k_ext
                                });
                                title = linksSmart['EXT_COMPANY'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'contact'){
                                placementManager.appendFrom({
                                    'value':'EXT_CONTACT_'+k_ext,
                                    'title':linksSmart['EXT_CONTACT'].title + portal,
                                    'data-code':item+'---'+k_ext
                                });
                                title = linksSmart['EXT_CONTACT'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'deal'){
                                placementManager.appendFrom({
                                    'value':'EXT_DEAL_'+k_ext,
                                    'title':linksSmart['EXT_DEAL'].title + portal,
                                    'data-code':item+'---'+k_ext
                                });
                                title = linksSmart['EXT_DEAL'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'lead'){
                                placementManager.appendFrom({
                                    'value':'EXT_LEAD_'+k_ext,
                                    'title':linksSmart['EXT_LEAD'].title + portal,
                                    'data-code':item+'---'+k_ext
                                });
                                title = linksSmart['EXT_LEAD'].title + portal;
                                append = true;
                            }else if(extItem[0] === 'awzorm'){
                                title = 'AWZ: ORM Api' + portal;
                                url_title = extItem[1].replace(/.*\/(.*\/bitrix\/services\/main\/ajax.php.*&key=[0-9a-zA-Z]{3}).*/g,"$1...");
                                url_title = url_title.replace('/bitrix/services/main/ajax.php?action=awz:bxorm.api.hook.','...');
                            }else if(extItem[0] === 'rpa'){
                                title = 'RPA ' + portal;
                            }else if(extItem[0] === 'smart'){
                                title = 'Смарты ' + portal;
                            }else if(extItem[0] === 'lists_lists'){
                                title = 'УС ' + portal;
                            }

                            ext_hooks.push({
                                'key':k_ext,
                                'title':title,
                                'url_title':url_title,
                                'portal': portal
                            });

                        }
                    }

                } catch (e) {
                    console.log(e);
                }

                //список Смартов внешние
                try {
                    if(iters['ex_smart']){
                        var k;
                        for (k in iters['ex_smart']) {

                            var item = iters['ex_smart'][k];

                            var serialize_param = 'ex_smart---'+item['ext_url'];
                            var hash = md5(serialize_param);
                            var portal = item['ext_url'].replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            placementManager.appendFrom({
                                'value':'EXT_DYNAMIC_'+item['entityTypeId']+'_e_'+hash,
                                'title':'Смарт: '+item['title'] + portal,
                                'data-code':'ex_smart---'+item['ext_url']+'---e_'+hash+'---'+item['entityTypeId']
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                //список RPA внешние
                try {
                    if(iters['ex_rpa']){
                        var k;
                        for (k in iters['ex_rpa']) {

                            var item = iters['ex_rpa'][k];

                            var serialize_param = 'ex_rpa---'+item['ext_url'];
                            var hash = md5(serialize_param);
                            var portal = item['ext_url'].replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            placementManager.appendFrom({
                                'value':'EXT_RPA_'+item['id']+'_e_'+hash,
                                'title':'RPA: '+item['title'] + portal,
                                'data-code':'ex_rpa---'+item['ext_url']+'---e_'+hash+'---'+item['id']
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }

                //список УС внешние
                try {
                    if(iters['ex_lists_lists']){
                        var k;
                        for (k in iters['ex_lists_lists']) {

                            var item = iters['ex_lists_lists'][k];

                            var serialize_param = 'ex_lists_lists---'+item['ext_url'];
                            var hash = md5(serialize_param);
                            var portal = item['ext_url'].replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            placementManager.appendFrom({
                                'value':'EXT_LISTS_LISTS_'+item['ID']+'_e_'+hash,
                                'title':'УС: '+item['NAME'] + portal,
                                'data-code':'ex_lists_lists---'+item['ext_url']+'---e_'+hash+'---'+item['ID']
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }


                //awz orm
                try {
                    var awz_methods = [];
                    if(iters['awz_orm']){
                        var k;
                        var k2;
                        for (k in iters['awz_orm']) {
                            if(!iters['awz_orm'][k].hasOwnProperty('url')) continue;
                            var row_url = iters['awz_orm'][k]['url'];
                            var portal = row_url.replace(/.*\/(.*)\/rest\/[0-9]+\/[a-z0-9]{3}.*/g," - $1");
                            if(portal.indexOf('/bitrix/services/main/ajax.php')>-1){
                                portal = row_url.replace(/.*\/(.*)\/bitrix\/.*/g," - $1");
                            }
                            for (k2 in iters['awz_orm'][k]) {
                                if(k2.indexOf('.fields')>-1){
                                    var tmp = k2.split('.');
                                    if(iters['awz_orm'][k].hasOwnProperty(tmp[0])){
                                        awz_methods.push({
                                            'url':row_url,
                                            'method':tmp[0],
                                            'title': iters['awz_orm'][k][tmp[0]],
                                            'portal':portal
                                        });
                                    }
                                }
                            }
                        }
                    }
                    var k;
                    for(k in awz_methods){
                        var item = awz_methods[k];

                        var serialize_param = 'awzorm---'+item['url'];
                        var hash = md5(serialize_param);
                        placementManager.appendFrom({
                            'value':'EXT_AWZORM_'+item['method']+'_e_'+hash,
                            'title':item['title'] + item['portal'],
                            'data-code':'awzorm---'+item['url']+'---e_'+hash+'---'+item['method']
                        });

                    }
                    console.log('awz_methods',awz_methods);
                } catch (e) {
                    console.log(e);
                }


                //зарегистрированные встройки
                $('.row-REST_APP_USERFIELD').show();
                $('.row-REST_APP_URI').show();
                window.awz_nhelper.appendHandlers(iters['awz_hook_list'], iters['placement_get'], iters['userfield_type']);
                window.awz_nhelper.appendExtHook(ext_hooks);
                window.awz_helper.remove_loader();
            }).catch((e) => {
                console.log(e);
            });

        },
        pagesize_total: 0,
        pagesize_next: 0,
        page_size: 10,
        autoLoadEntity: null,
        postData: function(data){
            //console.log(data);
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
            var PLACEMENT_OPTIONS = window.awz_nhelper.plcInfo();

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
                }
            }catch (e) {
                console.log(e);
            }

            var parent = this;
            window.awz_nhelper.getAddData(data).then(function(data){
                //window.location.pathname + window.location.search;
                //window.location.pathname = window.location.pathname.replace('/smarts/index.php');
                //console.log([window.location.pathname, window.location.search]);

                //var urlGrid = window.location.pathname + window.location.search;

                //BX.Main.gridManager.getById(parent.gridId).instance.
                window.awz_nhelper.getGrid().
                reloadTable('POST', {'bx_result':data, key: window.awz_helper.key, PLACEMENT_OPTIONS: JSON.stringify(PLACEMENT_OPTIONS)},function(){
                    window.awz_helper.preventSortableClick = false;
                    window.awz_helper.resize();
                    window.awz_nhelper.hidePreloaderGrid();
                    window.awz_helper.autoLoadEntity.load();
                    window.awz_helper.showStat();
                    window.awz_helper.showStat();
                }, window.awz_helper.gridUrl);
            }).catch(function(err){
                console.log(err);
                window.awz_helper.resize();
                window.awz_nhelper.hidePreloaderGrid();
            });
        },
        getSmartDataFiltered: function(filter, only_filter){
            var format_filter = {};
            var k;
            console.log('start_filter',filter);
            for(k in filter){
                if(!filter[k]) continue;
                if(k === 'FIND') {
                    if(this.gridOptions.hasOwnProperty('search_key') && this.gridOptions['search_key']){
                        format_filter[this.gridOptions['search_key']] = filter[k];
                        $('.main-ui-filter-search input.main-ui-filter-search-filter').val(filter[k]);
                        continue;
                    }
                    if(format_filter[k])
                        format_filter['%TITLE'] = filter[k];
                    continue;
                }

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
                if(typeof filter[k] === 'string' && filter[k].substring(0, 1) === '%'){
                    format_filter['%'+k] = filter[k].substring(1);
                }else{
                    format_filter[k] = filter[k];
                }
            }
            console.log('filtered',format_filter);
            if(only_filter) return format_filter;
            return this.getSmartData(null, format_filter);
        },
        getMethodListParams: function(params, type){
            var method = '';
            var check_order_upper = false;
            var check_add_upper = false;
            if(
                ['TASK_USER','EXT_TASK_USER']
                    .indexOf(this.gridOptions.PARAM_1)>-1
            )
            {
                method = this.gridOptions.method_list;
                check_order_upper = true;
                check_add_upper = true;
                if(type === 'group'){
                    params['select'] = ['ID', 'GROUP_ID'];
                }
            }
            else if(this.gridOptions.PARAM_1 === 'DOCS')
            {
                method = this.gridOptions.method_list;
                if(type === 'group'){
                    return false;
                }
            }
            else if(
                ['COMPANY','CONTACT','DEAL','LEAD','EXT_COMPANY','EXT_CONTACT','EXT_DEAL','EXT_LEAD']
                    .indexOf(this.gridOptions.PARAM_1)>-1
            )
            {
                method = this.gridOptions.method_list;
                check_order_upper = true;
                if(type === 'group'){
                    params['select'] = ['ID'];
                }
            }
            else if(this.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1)
            {
                method = this.gridOptions.method_list;
                check_order_upper = true;
                if(type === 'group'){
                    params['select'] = ['ID'];
                }
            }
            else if(this.gridOptions.PARAM_1 === 'WORKS')
            {
                method = this.gridOptions.method_list;
                check_order_upper = true;
                if(type === 'group'){
                    params['select'] = ['ID'];
                }
            }
            else if(this.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1)
            {
                method = this.gridOptions.method_list;
                params['entityTypeId'] = this.smartId;
            }
            else if(this.gridOptions.PARAM_1.indexOf('RPA_')>-1)
            {
                method = this.gridOptions.method_list;
                params['typeId'] = this.smartId;
            }
            else if(this.gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1)
            {
                method = this.gridOptions.method_list;
                params['IBLOCK_TYPE_ID'] = 'lists';
                params['IBLOCK_ID'] = this.smartId;
                //params['ELEMENT_ORDER'] = params['order'];
            }
            else{
                return false;
            }

            return {
                'method':method,
                'check_order_upper':check_order_upper,
                'check_add_upper':check_add_upper,
                'params':params
            };
        },
        getSmartData: function(order, filter){
            window.awz_nhelper.showError();
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

            var list_params = this.getMethodListParams(params, 'list');
            if(!list_params){
                alert('неизвестная приложению сущность '+this.smartId);
                return;
            }else{
                var method = list_params['method'];
                var check_order_upper = list_params['check_order_upper'];
                params = list_params['params'];
            }
            if(this.hasOwnProperty('fields_select')){
                if(this.fields_select)
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
                window.AwzBx24Proxy.callApi('sonet_group.get', {}, function(res){
                    window.awz_nhelper.checkRespError(res);
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

            params['filter'] = window.awz_nhelper.replaceFilter(params['filter']);

            window.AwzBx24Proxy.callApi(method, params, function(res){
                //console.log('call_api', res, method, params);
                window.awz_nhelper.checkRespError(res);
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

                        window.awz_helper.postData(
                            res.result
                        );

                    }
                }
            });

        },
        preventSortableClick: false,
        grid_ob: null,
        init: function(key, smartId, gridId, startSize, gridOptions){
            var parent = this;
            var parent_n = window.awz_nhelper;
            if(!this.hasOwnProperty('pagesManager') || !this.pagesManager){
                this.pagesManager = new AwzBx24PageManager();
                this.pagesManager = this.pagesManager.init();
            }

            if(!this.autoLoadEntity){
                this.autoLoadEntity = new AwzBx24EntityLoader();
                this.autoLoadEntity.init();
            }

            window.awz_nhelper.getItemForPlacement(true).then(function(itm){
                console.log('init find placement item', itm);
                return parent.init_after(key, smartId, gridId, startSize, gridOptions);
            }).catch(function(err){
                try{
                    if(parent_n.uTypes.isString()){
                        alert(err);
                    }else{
                        alert(err.message);
                    }
                }catch (e) {}
                console.log(err);
                return parent.init_after(key, smartId, gridId, startSize, gridOptions);
            });
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
            window.awz_nhelper.showPreloaderGrid();

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
                    //console.log(event);
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
                    window.awz_nhelper.canselGroupActions();
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
                            window.awz_nhelper.hidePreloaderGrid();
                            window.AwzBx24Proxy.openPath('/crm/type/'+window.awz_helper.smartId+'/details/'+data[1]['data']['ID']+'/?init_mode=edit');
                        }else if(data[1].hasOwnProperty('data') &&
                            typeof data[1]['data'] == 'object'
                            && data[1]['data'].hasOwnProperty('action_button_'+window.awz_helper.gridId) &&
                            data[1]['data']['action_button_'+window.awz_helper.gridId] == 'copy_row'
                        ){
                            data[1].cancelRequest = true;
                            window.awz_nhelper.hidePreloaderGrid();
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
            ht += '<a href="#" class="ui-btn ui-btn-sm ui-btn-icon-add awz-open-addlink"></a>';
            ht += '</div></div>';
            $('#uiToolbarContainer').append(ht);
            //$('#uiToolbarContainer').append('<div class="adm-toolbar-panel-container"><div class="adm-toolbar-panel-flexible-space"></div><a onclick="window.AwzBx24Proxy.openPath(\'/marketplace/detail/awz.smartbag/\');return false;" href="#" style="line-height:12px;" class="ui-btn ui-btn-sm ui-btn-icon-plan ui-btn-danger">Оставь бесплатный отзыв <br>для бесплатного приложения</a></div>');
            $('.ui-toolbar-filter-box').append('<a style="margin-left:5px;" href="#" class="ui-btn ui-btn-sm ui-btn-icon-info awz-open-filter"></a>');
        },
        showStatJs: function(data){
            if(window.awz_nhelper.uTypes.isObjectNoAr(data)){
                var k;
                for(k in data){
                    $('#stat-app-moved .awz-stat-'+k).html(data[k]);
                }
            }
            this.showStat();
            $('#stat-app').remove();
        },
        showStat: function(){
            //console.log('show-stats');
            var q_data_hook = {
                'domain':$('#signed_add_form').attr('data-domain'),
                'app':$('#signed_add_form').attr('data-app'),
                'signed':$('#signed_add_form').val(),
                'publicmode':1,
                'parentplacement':window.awz_helper.parentPlacement
            };
            var set_grid_button = '<a href="#" id="grid-settings-button" data-parentplacement="'+q_data_hook['parentplacement']+'" data-publicmode="'+q_data_hook['publicmode']+'" data-signed="'+q_data_hook['signed']+'" data-app="'+q_data_hook['app']+'" data-domain="'+q_data_hook['domain']+'" data-grid_id="'+this.gridId+'" data-key="'+this.key+'" data-page="sett-grid" class="awz-handler-slide-content ui-btn ui-btn-xs ui-btn-icon-setting"></a>';
            //console.log($('#stat-app').html());
            if($('#stat-app').html()){
                if($('#stat-app-moved').length){
                    $('#stat-app-moved').html(set_grid_button+$('#stat-app').html());
                }else{
                    $('.main-grid').prepend('<div id="stat-app-moved">'+set_grid_button+$('#stat-app').html()+'</div><div class="clear-fix"></div>');
                }
                $('#stat-app').remove();
            }else{
                if(!$('#grid-settings-button').length) {
                    $('#stat-app-moved').html(set_grid_button);
                }
            }
        },
        skipRows: function(data, group_action, callback){
            if (typeof data['ID'] === 'string'){
                data['ID'] = [data['ID']];
            }
            if(!callback) callback = function(){};
            var batch = [];
            var k;
            console.log('skip', data);
            for(k in data['ID']){
                batch.push({
                    'method':'skip',
                    'params':{
                        'id':data['ID'][k]
                    }
                });
            }
            var parent = this;
            window.awz_nhelper.getUpData(data, parent).then(function(data){
                if(batch.length){
                    if(group_action){
                        var last = null;
                        if(batch.length>0)
                            last = batch.pop();
                        var tmp_ = function(last, batch, callback){
                            if(batch.length){
                                callback.call(window.awz_helper, [], last ? 'first' : 'end');
                                if(last){
                                    callback.call(window.awz_helper, [], 'end');
                                }
                            }else if(last){
                                callback.call(window.awz_helper, [], 'end');
                            }
                        };
                        tmp_(last, batch, callback);
                    }else{
                        window.awz_helper.getSmartData();
                    }
                }
            }).catch(function(err){
                window.awz_nhelper.addError(
                    'Ошибка обработки данных при обновлении элементов','', err
                );
                window.awz_nhelper.showError();
            });
        },
        deleteRows: function(data, group_action, callbackDelete){
            if (typeof data['ID'] === 'string'){
                data['ID'] = [data['ID']];
            }
            if(!callbackDelete) callbackDelete = function(){};
            var batch = window.awz_nhelper.createBatchDelete(data);
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
                                        window.AwzBx24Proxy.callApi(last['method'], last['params'], function(res){
                                            callbackDelete.call(window.awz_helper, res, 'end');
                                        });
                                    }

                                }
                            );
                        }else if(last){
                            window.AwzBx24Proxy.callApi(last['method'], last['params'], function(res){
                                callbackDelete.call(window.awz_helper, res, 'end');
                            });
                        }
                    };
                    tmp_(last, batch, callbackDelete);
                }
                else {
                    window.AwzBx24Proxy.callBatch(batch, function (result) {
                            window.awz_helper.addBxTime(result);
                            window.awz_helper.getSmartData();
                        }
                    );
                }
            }
        },
        editRows: function(data, group_action, callbackUp){
            //console.log(['editRows',data, group_action, callbackUp]);
            var batch = [];
            var k;
            var k2;
            if(!callbackUp) callbackUp = function(){};
            window.awz_nhelper.showPreloaderGrid();

            var check_delete = false;
            var delete_ob = {'ID':[]};
            for(k in data['FIELDS']){
                for(k2 in data['FIELDS'][k]) {
                    if(k2 === 'delete'){
                        check_delete = true;
                        delete_ob['ID'].push(k);
                    }
                    /*if(this.gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1){
                        data['FIELDS'][k][k2] = data['FIELDS'][k][k2][0];
                    }*/
                }
            }
            if(check_delete){
                //console.log(delete_ob);
                return this.deleteRows(delete_ob, group_action, callbackUp);
            }

            var parent = this;
            window.awz_nhelper.getUpData(data, parent).then(function(data){
                var formatFields = {};
                /*for(k in data['FIELDS']){
                    if(parent.fields[k])
                }*/

                var check_skip = false;

                for(k in data['FIELDS']){
                    if(k === 'template_0') continue;
                    for(k2 in data['FIELDS'][k]) {
                        //console.log(k2);
                        //console.log(data['FIELDS'][k]);
                        if(k2.indexOf('_custom')>-1) {
                            delete data['FIELDS'][k][k2];
                            continue;
                        }
                        if(!parent.fields[k2]) continue;

                        if(data['FIELDS'][k][k2] == '-skip-'){
                            check_skip = true;
                            continue;
                        }

                        if (parent.fields[k2].hasOwnProperty('isMultiple') && (parent.fields[k2]['isMultiple']==1 || parent.fields[k2]['isMultiple']=='Y')) {
                            //console.log('field',parent.fields[k2]);
                            //console.log(data['FIELDS'][k][k2]);
                            if (window.awz_nhelper.uTypes.isString(data['FIELDS'][k][k2])) {
                                //console.log('is string', data['FIELDS'][k][k2]);
                                var delimeter = ',';
                                if(!data['FIELDS'][k][k2]){
                                    data['FIELDS'][k][k2] = [''];
                                }else{
                                    data['FIELDS'][k][k2] = data['FIELDS'][k][k2].split(delimeter);
                                }
                            }else if(window.awz_nhelper.uTypes.isNumber(data['FIELDS'][k][k2])){
                                //console.log('is num', data['FIELDS'][k][k2]);
                                if(!data['FIELDS'][k][k2]){
                                    data['FIELDS'][k][k2] = [''];
                                }
                                data['FIELDS'][k][k2] = [data['FIELDS'][k][k2]];
                            }
                        }
                    }

                    if(check_skip){
                        batch.push({
                            'method':'-skip-',
                            'params':{
                                'id':k,
                                'fields':data['FIELDS'][k]
                            }
                        });
                        continue;
                    }


                    if(parent.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                        var itm = {};
                        var k2;
                        for(k2 in data['FIELDS'][k]){
                            if(!parent.fields[k2]) continue;
                            itm[parent.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                        }
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'taskId':k,
                                'fields':itm
                            }
                        });
                    }
                    else if(['EXT_TASK_USER','TASK_USER'].indexOf(parent.gridOptions.PARAM_1)>-1){
                        var itm = {};
                        var k2;
                        for(k2 in data['FIELDS'][k]){
                            if(!parent.fields[k2]) continue;
                            itm[parent.fields[k2]['upperCase']] = data['FIELDS'][k][k2];
                        }
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'taskId':k,
                                'fields':itm
                            }
                        });
                    }
                    else if(
                        ['WORKS','COMPANY','EXT_COMPANY','CONTACT','EXT_CONTACT','DEAL','EXT_DEAL','LEAD','EXT_LEAD']
                            .indexOf(parent.gridOptions.PARAM_1)>-1
                    ){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'id':k,
                                'fields':data['FIELDS'][k]
                            }
                        });
                    }
                    else if(parent.gridOptions.PARAM_1.indexOf('EXT_AWZORM_')>-1){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'id':k,
                                'fields':data['FIELDS'][k]
                            }
                        });
                    }
                    else if(['DOCS'].indexOf(parent.gridOptions.PARAM_1)>-1){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'id':k,
                                'values':data['FIELDS'][k]
                            }
                        });
                    }
                    else if(parent.gridOptions.PARAM_1.indexOf('DYNAMIC_')>-1){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'entityTypeId':parent.smartId,
                                'id':k,
                                'fields':data['FIELDS'][k]
                            }
                        });
                        //console.log(['edit', data['FIELDS'][k]]);
                    }
                    else if(parent.gridOptions.PARAM_1.indexOf('RPA_')>-1){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'typeId':parent.smartId,
                                'id':k,
                                'fields':data['FIELDS'][k]
                            }
                        });
                        //console.log(['edit', data['FIELDS'][k]]);
                    }
                    else if(parent.gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1){
                        batch.push({
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'IBLOCK_TYPE_ID':'lists',
                                'IBLOCK_ID':parent.smartId,
                                'ELEMENT_ID':k,
                                'FIELDS':data['FIELDS'][k]
                            }
                        });
                        //console.log(['edit', data['FIELDS'][k], k]);
                    }

                }
                if(batch.length){
                    console.log('batch created len:', batch.length);
                    if(group_action){
                        var last = null;
                        if(batch.length>0)
                            last = batch.pop();
                        var tmp_ = function(last, batch2, callbackUp){
                            if(batch2.length){
                                if(check_skip){
                                    callbackUp.call(window.awz_helper, [], last ? 'first' : 'end');
                                    if(last){
                                        callbackUp.call(window.awz_helper, [], 'end');
                                    }
                                }else{
                                    window.AwzBx24Proxy.callBatch(batch2, function(result)
                                        {
                                            window.awz_nhelper.checkRespError(result);
                                            callbackUp.call(window.awz_helper, result, last ? 'first' : 'end');
                                            if(last){
                                                window.AwzBx24Proxy.callApi(last['method'], last['params'], function(res){
                                                    window.awz_nhelper.checkRespError(res);
                                                    callbackUp.call(window.awz_helper, res, 'end');
                                                });
                                            }

                                        }
                                    );
                                }
                                /*
                                window.AwzBx24Proxy.callBatch(batch2, function(result)
                                    {
                                        window.awz_nhelper.checkRespError(result);
                                        callbackUp.call(window.awz_helper, result, last ? 'first' : 'end');
                                        if(last){
                                            window.AwzBx24Proxy.callApi(last['method'], last['params'], function(res){
                                                window.awz_nhelper.checkRespError(res);
                                                callbackUp.call(window.awz_helper, res, 'end');
                                            });
                                        }

                                    }
                                );*/
                            }else if(last){
                                if(check_skip){
                                    callbackUp.call(window.awz_helper, [], 'end');
                                }else{
                                    window.AwzBx24Proxy.callApi(last['method'], last['params'], function(res){
                                        window.awz_nhelper.checkRespError(res);
                                        callbackUp.call(window.awz_helper, res, 'end');
                                    });
                                }

                            }
                        };
                        tmp_(last, batch, callbackUp);
                    }
                    else{
                        if(check_skip){
                            window.awz_helper.getSmartData();
                        }else{
                            window.AwzBx24Proxy.callBatch(batch, function(result)
                                {
                                    window.awz_nhelper.checkRespError(result);
                                    window.awz_helper.addBxTime(result);
                                    window.awz_helper.getSmartData();
                                }
                            );
                        }

                    }

                }
            }).catch(function(err){
                window.awz_nhelper.addError(
                    'Ошибка обработки данных при обновлении элементов','', err
                );
                window.awz_nhelper.showError();
            });
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
        menuCustom: function(url){
            var itmFind = window.awz_nhelper.getItemForPlacement();
            console.log('menuCustom',itmFind);
            var k2;
            for(k2 in itmFind){
                url = url.replace("#"+k2+"#", itmFind[k2]);
            }
            window.AwzBx24Proxy.openPath(url);
        },
        menuNewEl: function(){
            var plc_info = BX24.placement.info();
            var crm_item_id = '';
            var cur_user_id = this.hasOwnProperty('currentUserId') ? this.currentUserId : '0';
            var cur_user_id_ext = this.hasOwnProperty('extUrl') ? this.extUrl.replace(/.*\/rest\/([0-9]+)\/.*/g, "$1") : '0';
            if(this.gridOptions.PARAM_1 === 'TASK_USER'){
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
            }else if(this.gridOptions.PARAM_1.indexOf('RPA_')>-1){
                window.AwzBx24Proxy.openPath('/rpa/item/'+this.smartId+'/0/');
            }else if(this.gridOptions.PARAM_1 === 'COMPANY'){
                window.AwzBx24Proxy.openPath('/crm/company/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'CONTACT'){
                window.AwzBx24Proxy.openPath('/crm/contact/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'DEAL'){
                window.AwzBx24Proxy.openPath('/crm/deal/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'LEAD'){
                window.AwzBx24Proxy.openPath('/crm/lead/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_COMPANY'){
                window.AwzBx24Proxy.openPath('/crm/company/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_CONTACT'){
                window.AwzBx24Proxy.openPath('/crm/contact/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_DEAL'){
                window.AwzBx24Proxy.openPath('/crm/deal/details/0/');
            }else if(this.gridOptions.PARAM_1 === 'EXT_LEAD'){
                window.AwzBx24Proxy.openPath('/crm/lead/details/0/');
            }else if(this.gridOptions.PARAM_1.indexOf('LISTS_LISTS_')>-1){
                window.AwzBx24Proxy.openPath('/company/lists/'+this.smartId+'/element/0/0/?list_section_id=');
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
        applyGroupButton: function(action){
            console.log('applyGroupButton', action);
            window.awz_nhelper.showPreloaderGrid();
            var actionId = $('#base_action_select_control').attr('data-value');
            var field_up_id = actionId.replace("control_ef_","");
            var field_type = 'update';
            if(field_up_id === 'delete')
                field_type = 'delete';
            if(field_up_id === 'copy')
                field_type = 'copy';
            if(field_up_id === 'bp')
                field_type = 'bp';
            if(['copy','bp','delete'].indexOf(field_type)>-1){
                return window.awz_nhelper.applyGroupButton(action);
            }

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

            if(check_all && !window.awz_helper.pagesize_total)
            {
                this.grid_ob.getParent().arParams['MESSAGES'] = [{
                    'TYPE': 'ERROR',
                    'TITLE': 'Ошибка',
                    'TEXT': 'Общее количество элементов не указано'
                }];
                this.grid_ob.getParent().messages.show();
            }
            else if(check_all || field_type === 'copy')
            {
                window.awz_helper.last_turn_id = 0;
                var started_fast = true;
                var text_before = "Обработка элементов по фильтру <a class=\"close_ids_change\" href=\"#\">отменить</a>";
                if(field_type === 'copy'){
                    text_before = "Копирование элементов <a class=\"close_ids_change\" href=\"#\">отменить</a>";
                }else if(field_type === 'bp'){
                    text_before = "Запуск БП <a class=\"close_ids_change\" href=\"#\">отменить</a>";
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
                    //console.log('copy', method, params_copy, ob_tmp);
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
                        //console.log('add intervals_turn', ob_tmp['FIELDS'][field_up_id]);
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
                    }else if(window.awz_helper.intervals_lock2 > new Date()){
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
                    //console.log('intervals_turn',el);
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
                    if(up_object.hasOwnProperty('add'))
                    {
                        //console.log('add',window.awz_helper.temp_items[up_object['add']][k]);
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
                            if(params.hasOwnProperty('typeId')){
                                prm['typeId'] = params['typeId'];
                            }
                            if(params.hasOwnProperty('IBLOCK_ID')){
                                prm['IBLOCK_ID'] = params['IBLOCK_ID'];
                            }
                            if(params.hasOwnProperty('IBLOCK_TYPE_ID')){
                                prm['IBLOCK_TYPE_ID'] = params['IBLOCK_TYPE_ID'];
                                prm['ELEMENT_CODE'] = '';
                            }
                            /*
                            * {
                            'method':parent.gridOptions.method_update,
                            'params':{
                                'IBLOCK_TYPE_ID':'lists',
                                'IBLOCK_ID':parent.smartId,
                                'ELEMENT_ID':k,
                                'FIELDS':data['FIELDS'][k]
                            }
                        }
                            * */
                        }
                        if(prm.fields.hasOwnProperty('id')){
                            delete prm.fields['id'];
                        }
                        if(prm.fields.hasOwnProperty('ID')){
                            delete prm.fields['ID'];
                        }
                        //console.log('prm',prm,params);
                    }
                    if(prm.hasOwnProperty('f_key')){
                        prm['filter'][prm['f_key']] = window.awz_helper.last_turn_id;
                        delete prm['f_key'];
                    }

                    //console.log('up_object', up_object);
                    window.awz_helper.current_group_action_batch = true;
                    if(up_object.hasOwnProperty('add'))
                    {

                        window.awz_helper.tmp_func = function(method, prm){

                            if(method === 'lists.element.add'){
                                prm['ELEMENT_CODE'] = new Date().getTime()+'_'+Math.floor(Math.random() * 8)+'_00';
                            }

                            window.AwzBx24Proxy.callApi(method, prm, function(bres){
                                window.awz_nhelper.checkRespError(bres);
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
                                if(method === 'lists.element.add'){
                                    prm['ELEMENT_CODE'] = new Date().getTime()+'_'+Math.floor(Math.random() * 8)+'_'+k3;
                                    bach_tmp.push({
                                        'method': method,
                                        'params': Object.assign({},prm)
                                    });
                                }else{
                                    bach_tmp.push({
                                        'method': method,
                                        'params': prm
                                    });
                                }
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

                    }
                    else
                    {
                        window.AwzBx24Proxy.callApi(method, prm, function(res){
                            window.awz_helper.intervals_lock_last_res = res;
                            window.awz_nhelper.checkRespError(res);
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

                                if(up_object.hasOwnProperty('cnt'))
                                {
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
                                }
                                else{
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

            }
            else
            {
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
                                window.awz_nhelper.canselGroupActions();
                                return;
                            }
                            if(timerResult_cnt == 5){
                                myProgress.setTextAfter('<a href="#" class="open-smart" data-id="'+res['answer']['result']['item']['id']+'" data-ent="'+entityId+'">элемент</a>: результат не получен за 25 секунд');
                                myProgress.update(timerResult_cnt);
                                clearTimeout(timerResult);
                                window.awz_nhelper.canselGroupActions();
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
            var method = '';
            var params = {};
            var check_order_upper = false;
            var check_add_upper = false;
            params['filter'] = this.lastFilter;
            params['select'] = ['id'];
            params['order'] = this.lastOrder;

            var list_params = this.getMethodListParams(params, 'group');
            if(!list_params){
                alert('неизвестная приложению сущность '+this.smartId);
                return;
            }else{
                method = list_params['method'];
                check_order_upper = list_params['check_order_upper'];
                check_add_upper = list_params['check_add_upper'];
                params = list_params['params'];
            }

            if(window.awz_helper.hasOwnProperty('addFilter') && typeof window.awz_helper.addFilter === 'object'){
                var fl_key;
                for(fl_key in window.awz_helper.addFilter){
                    params['filter'][fl_key] = window.awz_helper.addFilter[fl_key];
                }
            }

            params['filter'] = window.awz_nhelper.replaceFilter(params['filter']);
            return [method, params, check_order_upper, check_add_upper];
        },
        sleep: function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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


    $(document).on('click', '.awz-open-filter', function(e){
        e.preventDefault();
        var k;
        var ht = '<b>текущий фильтр</b>';
        ht += '<textarea class="filter-info-textarea" style="height:44px;">'+JSON.stringify(window.awz_helper.lastFilter)+'</textarea>';
        try{
            ht += '<b>PLACEMENT_OPTIONS</b>';
            ht += '<textarea class="filter-info-textarea" style="height:30px;">'+JSON.stringify(BX24.placement.info())+'</textarea>';
        }catch (e) {

        }
        try{
            ht += '<b>Параметры встройки (предзагрузка)</b><br>';
            var opts = window.awz_nhelper.plcInfo();
            for(k in opts['options']){
                ht += '#'+k+'# - '+opts[k]+'<br>';
            }
            ht += '--- --- ---<br>';
            ht += '<b>Параметры встройки (на клиенте)</b><br>';
            for(k in opts){
                if(k !== 'options')
                    ht += '#'+k+'# - '+opts[k]+'<br>';
            }
            ht += '--- --- ---<br>';
        }catch (e) {
            console.log(e);
        }
        var itmFind = window.awz_nhelper.getItemForPlacement();
        try {
            ht += '<b>Параметры полей (постзагрузка)</b><br>';
            for (k in itmFind) {
                ht += '#' + k + '# - ' + itmFind[k] + '<br>';
            }
            ht += '--- --- ---<br>';
        }catch (e) {
            console.log(e);
        }
        var popup = window.awz_helper.getPopupFields('settings-wrap-filter', 'Параметры фильтра и встройки');
        popup.setContent('<div class="fields-wrap">'+ht+'</div>');
        popup.show();
    });
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
    $(document).on('click', '.close_ids_change', function(e){
        e.preventDefault();
        window.awz_nhelper.canselGroupActions();
    });
    $(document).on('change', '#placement-sett #select-crm-entity-to', function(e){
        //var c_val = $(this).val();
        window.awz_helper.getPlacementsList();
    });
    $(document).on('click', '.open-dialog-deal, .open-dialog-lead, .open-dialog-company, .open-dialog-contact', function(e){
        e.preventDefault();
        var type = '';
        if($(this).hasClass('open-dialog-deal')) type = 'deal';
        if($(this).hasClass('open-dialog-lead')) type = 'lead';
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
    $(document).on('click', '#clear-awz-app-cache', function(e){
        e.preventDefault();
        $('.err-rows-sett').html('');
        var q_data = {
            'domain':$('#signed_add_form').attr('data-domain'),
            'app':$('#signed_add_form').attr('data-app'),
            'signed':$('#signed_add_form').val(),
            'cache_key':'options'
        };
        $.ajax({
            url: '/bitrix/services/main/ajax.php?action=awz:bxapi.api.smartapp.deletecache',
            data: q_data,
            dataType: "json",
            type: "POST",
            CORS: false,
            crossDomain: true,
            timeout: 180000,
            async: true,
            success: function (data, textStatus) {
                window.awz_helper.loadHandledApp();
                if(data['status'] === 'error'){
                    alert(data['errors'][0]['message']);
                }
            }
        });
        $(this).remove();
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
                'main_menu':$('#main-menu-active').is(":checked") ? $('#main-menu-active').val() : 'N',
                'placements':[]
            }
        };
        if($('#placements-list').val()){
            q_data['params']['placements'] = $('#placements-list').val().split(',');
        }else{
            q_data['params']['placements'] = [];
        }
        if($('#placement-mlink').val()){
            q_data['params']['mlink'] = $('#placement-mlink').val();
        }else{
            q_data['params']['mlink'] = '';
        }
        if($('#placement-grid-filter').val()){
            q_data['params']['grid_filter'] = $('#placement-grid-filter').val();
        }else{
            q_data['params']['grid_filter'] = '';
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
        if(placement === 'awzuientity'){
            BX24.callMethod(
                'userfieldtype.delete',
                {
                    'USER_TYPE_ID': placement,
                },
                function(res)
                {
                    window.awz_helper.addBxTime(res);
                    window.awz_helper.loadHandledApp();
                }
            );
            return;
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