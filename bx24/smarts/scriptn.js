function AwzBx24PageManager(){};
AwzBx24PageManager.prototype = {
    init: function(options){
        this.initHandlers();
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
        BX24.scrollParentWindow(0);
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
window.AwzBx24Proxy = {
    openPath: function(path){
        if(window.awz_helper.hasOwnProperty('extUrl')){
            var path_ext = window.awz_helper.extUrl.replace(/(.*?)\/rest\/.*/g,"$1") + path;
            $('body').append('<div class="awz-ext-window-bg"><div class="awz-ext-window"><h4>Переход на внешний портал</h4><div class="buttons">' +
                '<a href="#" class="close ui-btn ui-btn-xs ui-btn-danger">закрыть окно</a>'+
                '<a href="'+path_ext+'" target="_blank" class="close_ext ui-btn ui-btn-xs">перейти</a>'+
                '</div></div></div>');
        }else{
            BX24.openPath(path);
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
    callBatch: function(batch, callback, bHaltOnError){
        if(!callback) callback = function(){};

        if(window.awz_helper.hasOwnProperty('extUrl')){
            //window.awz_helper.addBxTime(result);
            var cmdData = [];
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
                cmdData.push(batch_row.method+''+query_data);
                cnt += 1;
            }

            //console.log(cmdData);
            $.ajax({
                url: window.awz_helper.extUrl+'batch',
                data: {cmd: cmdData, halt: false},
                dataType : "json",
                type: "POST",
                CORS: false,
                success: function (data, textStatus){
                    window.awz_helper.addBxTime(data);
                    window.awz_helper.getSmartData();
                    console.log(data);
                },
                error: function (err){
                    console.log(err);
                }
            });
        }else{
            BX24.callBatch(batch, callback, bHaltOnError);
        }
    },
    checkRespError:function(data){
        try{
            if(data.statusText){
                console.log(data);
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
                this.placements = new AwzBx24PlacementManager;
                this.placements.init({
                    'placements':[
                        {
                            'value':'REST_APP_URI',
                            'title':'Ссылка на приложение с параметрами',
                            'data-code':'REST_APP_URI'
                        },
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
                    ],
                    'onBeforeGetList': function(option, from, to){
                        if(!from) return false;
                        if(!to) return false;
                        if(from === 'APP_LINK'){
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
                            });
                        }
                        $('#placement-sett-manager-to').find('option').each(function(){
                            if($(this).attr('value') && $(this).attr('value')==='TASK_USER_CRM') $(this).remove();
                            if($(this).attr('value') && $(this).attr('value')==='EXT_TASK_USER') $(this).remove();
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
                        if(type === 'REST_APP_URI'){
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

                            if(smart === 'DOCS') version = 'new';
                            if(smart === 'DOCS_CRM') version = 'new';
                            if(smart === 'TASK_USER') version = 'new';
                            if(smart === 'TASK_USER_CRM') version = 'new';
                            if(smart === 'TASK_GROUPS') version = 'new';
                            if(smart.indexOf('TASK_GROUP_')>-1) version = 'new';
                            if(smart.indexOf('EXT_TASK_USER_')>-1) version = 'new';

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
                            }
                            if(smart_to === 'DOCS') smart_to = '';

                            $('#placement-sett-manager-type').find('option').each(function(){
                                if($(this).attr('value') === type){
                                    placement = $(this).attr('data-code').replace(/#1#/g, smart_to);
                                }
                            });
                            if(smart.indexOf('EXT_TASK_USER_')>-1){
                                grid_key += '1_EXT_TASK_USER__2_'+smart_to;
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

                            if(smart.indexOf('EXT_TASK_USER_')>-1){
                                $('#placement-sett-manager-from').find('option').each(function(){
                                    if($(this).attr('value') === smart){
                                        if($(this).attr('data-code').indexOf('---')>-1){
                                            var tmpCode = $(this).attr('data-code').split('---');
                                            url += '&ext='+tmpCode[1].replace(/https:\/\//g,"");
                                        }
                                    }
                                });
                            }

                            if(url.length>255){
                                alert('Превышена максимальная длина вебхука '+url.length+' > 255');
                            }else{
                                BX24.callMethod(
                                    'placement.bind',
                                    {
                                        'PLACEMENT': placement,
                                        'HANDLER': url,
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
                                            alert(res.answer.error_description);
                                        }else{
                                            window.awz_helper.loadHandledApp();
                                        }
                                    }
                                );
                            }
                        }
                    },
                });
            }
            return this.placements;
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
        loadHandledApp: function(){

            this.pagesManager = new AwzBx24PageManager();
            this.pagesManager = this.pagesManager.init();

            if(!BX24.isAdmin()){
                this.pagesManager.hidePages();
                this.pagesManager.showMessage('<div class="ui-alert ui-alert-danger">Настройка встроек доступна только администратору портала</div>');
                return;
            }

            var placementManager = this.getPlacementManager();
            placementManager.show();

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

            BX24.callBatch(
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

                            var title = extItem[0];
                            if(extItem[0] === 'task'){
                                placementManager.appendFrom({
                                    'value':'EXT_TASK_USER_'+k_ext,
                                    'title':linksSmart['EXT_TASK_USER'].title + portal,
                                    'data-code':items_ext[k_ext]+'---'+k_ext
                                });
                                title = linksSmart['EXT_TASK_USER'].title + portal;
                            }

                            $('.rows-ext-smarts').append('<div class="row" style="margin-bottom:10px;">' +
                                '<div class="col-xs-3 no-padding-l">' +
                                '<label class="main-grid-control-label">'+k_ext+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3">' +
                                '<label class="main-grid-control-label">'+title+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3">' +
                                '<label class="main-grid-control-label">'+extItem[1].replace(/.*\/(.*\/rest\/[0-9]+\/[a-z0-9]{3}).*/g,"$1...")+'</label>' +
                                '</div>' +
                                '<div class="col-xs-3 no-padding-r">' +
                                '<a href="#" data-handler="'+k_ext+'" class="remove_ext_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Удалить</a>' +
                                '</div>' +
                                '</div>');
                        }
                        window.awz_helper.resize();
                    }

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
                                        var candidate = placement['placement'].split('_');

                                        var gridParams = window.awz_helper.getGridParamsFromUrl(placement['handler']);
                                        console.log([gridParams, candidate, placement]);

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
                                            }else if(placement['handler'].indexOf('smartId=DOCS')>-1){
                                                code = 'DOCS';
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
                                        console.log([code,code_to,item,item_to]);

                                        if(!item || !item_to){
                                            $('.rows-smarts').append('<div class="row" style="margin-bottom:10px;">' +
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
                                                '<a href="#" data-handler="'+placement['handler']+'" data-placement="'+placement['placement']+'" class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Деактивировать</a>' +
                                                '</div>' +
                                                '</div>');
                                        }else{
                                            $('.rows-smarts').append('<div class="row" style="margin-bottom:10px;">' +
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
                                                '<a href="#" data-handler="'+placement['handler']+'" data-placement="'+placement['placement']+'" class="remove_smart_handled ui-btn ui-btn-xs ui-btn-icon-alert">Деактивировать</a>' +
                                                '</div>' +
                                                '</div>');
                                        }
                                    }
                                }

                            } catch (e) {
                                console.log(e);
                            }
                            window.awz_helper.resize();
                        }
                    );
                }
            );


        },
        pagesize_total: 0,
        pagesize_next: 0,
        page_size: 10,
        postData: function(data){
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
            BX.Main.gridManager.getById(this.gridId).instance.
            reloadTable('POST', {'bx_result':data, key: this.key},function(){
                window.awz_helper.preventSortableClick = false;
                window.awz_helper.resize();
            });
        },
        getSmartDataFiltered: function(filter, only_filter){
            var format_filter = {};
            var k;
            console.log(filter);
            for(k in filter){
                if(k === 'FIND') {
                    if(format_filter[k])
                        format_filter['%title'] = format_filter[k];
                    continue;
                }
                if(!filter[k]) continue;

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
                alert('неизвестная приложению сущность');
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

            window.awz_helper.callApi(method, params, function(res){
                window.AwzBx24Proxy.checkRespError(res);
                if(typeof res == 'object'){
                    if(res.hasOwnProperty('total')){
                        window.awz_helper.pagesize_total = res.total;
                    }
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
                        try{

                            var items = [];
                            var items_key = 'items';
                            if(window.awz_helper.hasOwnProperty('gridOptions')){
                                items_key = window.awz_helper.gridOptions['result_key'];
                            }
                            items = res.result[items_key];

                            for(k in items){
                                var item = items[k];
                                var k2;
                                for(k2 in user_fields){
                                    if(item[user_fields[k2]]){
                                        if(!window.awz_helper.users.hasOwnProperty(item[user_fields[k2]])){
                                            if(users_get.indexOf(item[user_fields[k2]])===-1)
                                                users_get.push(item[user_fields[k2]]);
                                        }else{
                                            users_data[item[user_fields[k2]]] = {
                                                'ID': window.awz_helper.users[item[user_fields[k2]]].ID,
                                                'NAME': window.awz_helper.users[item[user_fields[k2]]].NAME,
                                                'LAST_NAME': window.awz_helper.users[item[user_fields[k2]]].LAST_NAME,
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
                                        users_data[id_usr] = {
                                            'ID': window.awz_helper.users[id_usr].ID,
                                            'NAME': window.awz_helper.users[id_usr].NAME,
                                            'LAST_NAME': window.awz_helper.users[id_usr].LAST_NAME,
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
        init: function(key, smartId, gridId, startSize, gridOptions){

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
        showStat: function(){
            if($('#stat-app').html()){
                if($('#stat-app-moved').length){
                    $('#stat-app-moved').html($('#stat-app').html());
                }else{
                    $('.main-grid').append('<div id="stat-app-moved">'+$('#stat-app').html()+'</div>');
                }
            }
        },
        deleteRows: function(data){
            if (typeof data['ID'] === 'string'){
                data['ID'] = [data['ID']];
            }
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
                }else if(['DOCS','DOCS_CRM'].indexOf(this.gridOptions.PARAM_1)>-1){
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
                window.AwzBx24Proxy.callBatch(batch, function(result)
                    {
                        window.awz_helper.addBxTime(result);
                        window.awz_helper.getSmartData();
                    }
                );
            }
        },
        editRows: function(data){
            var batch = [];
            var k;
            //console.log(['edit', data]);
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
                }

            }
            if(batch.length){
                window.AwzBx24Proxy.callBatch(batch, function(result)
                    {
                        window.awz_helper.addBxTime(result);
                        window.awz_helper.getSmartData();
                    }
                );
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
                var url = 'http'+(PARAMS.PROTOCOL?'s':'')+'://' + PARAMS.DOMAIN + PARAMS.PATH + '/' + encodeURIComponent(method) + '.json';
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
                        success: function (data, textStatus){
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
            }
        },
        rmCache: function(){
            this.cache_action = 'remove';
            this.getSmartData();
        },
        reloadList: function(){
            this.getSmartData();
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
                                return;
                            }
                            if(timerResult_cnt == 5){
                                myProgress.setTextAfter('<a href="#" class="open-smart" data-id="'+res['answer']['result']['item']['id']+'" data-ent="'+entityId+'">элемент</a>: результат не получен за 25 секунд');
                                myProgress.update(timerResult_cnt);
                                clearTimeout(timerResult);
                                return;
                            }
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

                var batch_prepare = [];
                var method = 'crm.item.list';
                var params = {};
                params['filter'] = this.lastFilter;
                params['select'] = ['id'];
                params['order'] = this.lastOrder;

                var plc_info = BX24.placement.info();

                if(this.gridOptions.PARAM_1 === 'TASK_USER_CRM'){
                    method = this.gridOptions.method_list;
                    params['select'] = ['ID'];
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
                }else if(this.gridOptions.PARAM_1 === 'TASK_GROUPS'){
                    method = this.gridOptions.method_list;
                    params['select'] = ['ID', 'GROUP_ID'];
                    params['filter']['GROUP_ID'] = plc_info.options.GROUP_ID;
                }

                //TODO не хватает сущностей для выборки всех
                if(window.awz_helper.hasOwnProperty('addFilter') && typeof window.awz_helper.addFilter === 'object'){
                    var fl_key;
                    for(fl_key in window.awz_helper.addFilter){
                        params['filter'][fl_key] = window.awz_helper.addFilter[fl_key];
                    }
                }

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
                        BX24.callBatch(batch_prepare, function(result)
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
        sleep: function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        canselGroupActions: function(){

            /*var dropdown = BX('base_action_select_control');
            var container = dropdown.parentNode;
            this.grid_ob.getParent().getActionsPanel().onChangeHandler(container);
            this.grid_ob.getParent().getActionsPanel().activateControl('default');*/
            this.reloadList();
            //this.grid_ob.getParent().getActionsPanel().removeItemsRelativeCurrent(BX('base_action_select_control'));
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

        }

    }

    //$('#placement-sett #select-crm-entity-to')
    $(document).on('click', '.close_ids_change', function(e){
        e.preventDefault();
        window.awz_helper.prepared_ids = false;
    });
    $(document).on('change', '#placement-sett #select-crm-entity-to', function(e){
        //var c_val = $(this).val();
        window.awz_helper.getPlacementsList();
    });
    $(document).on('click', '.open-dialog-deal, .open-dialog-company', function(e){
        e.preventDefault();
        var type = '';
        if($(this).hasClass('open-dialog-deal')) type = 'deal';
        if($(this).hasClass('open-dialog-company')) type = 'company';
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
    $(document).on('click', '.remove_smart_handled', function(e){
        e.preventDefault();
        var placement = $(this).attr('data-placement');
        var handler = $(this).attr('data-handler');
        BX24.callMethod(
            'placement.unbind',
            {
                'PLACEMENT': placement,
                'HANDLER': handler
            },
            function(res)
            {
                window.awz_helper.addBxTime(res);
                window.awz_helper.loadHandledApp();
            }
        );
    });

    $(document).on('click', '.open-smart', function(e){
        e.preventDefault();
        var id = $(this).attr('data-id');
        var ent = $(this).attr('data-ent');
        if (ent === 'auto'){
            var tmp = id.replace(/([\d\+])/g,'');
            if(tmp == 'C_') ent = 'contact';
            if(tmp == 'CO_') ent = 'company';
            if(tmp == 'D_') ent = 'deal';
            if(tmp == 'L_') ent = 'lead';
            if(id.charAt(0) === 'T') {
                var tmp2 = id.split('_');
                ent = parseInt(tmp2[0].replace(/^T/g,''), 16);
                id = tmp2[1];
            }
        }
        var path = '';
        if(ent === 'task'){
            path = '/company/personal/user/0/tasks/task/view/'+id+'/';
        }else if(ent === 'deal'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'lead'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'company'){
            path = '/crm/'+ent+'/details/'+id.replace(/([^\d\+])/g,'')+'/';
        }else if(ent === 'contact'){
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