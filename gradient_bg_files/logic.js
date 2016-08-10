var t1 = new TimelineLite();
var t2 = new TimelineLite();
var t3 = new TimelineLite();
var t4 = new TimelineLite();
t1.autoRemoveChildren = true;
t2.autoRemoveChildren = true;
t3.autoRemoveChildren = true;
t4.autoRemoveChildren = true;

var App = {
    /* This runs when the page initially loads. */
    init: function () {
        if(App.getQueryVariable('debug') == 'true') {
            document.getElementById("pause").style.display = "block";
        }
        App.cacheElements();
        App.bindEvents();
        App.initExperience();
    }, 
    getQueryVariable: function (variable) {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
    },
    
    /* Create references to on-screen elements. */
    cacheElements: function () {
        App.$ad = document.getElementById("ad");
        App.$popup = document.getElementById("popup");
        App.$legalButton = document.getElementById("legalButton");
        App.$cta = document.getElementById("buttonContainer");
    },

    /* Create click handlers for buttons that appear on-screen. */
    bindEvents: function () {
        App.$popup.onclick = function(){App.hidePopup();}
        App.$legalButton.onclick = function(){App.showPopup();}
        App.$cta.onmouseover = function(){App.ctaMouseover();}
        App.$cta.onmouseout = function(){App.ctaMouseout();}
    },
    clickThrough: function() {
        console.log("clickThrough");
    },
    ctaMouseover: function () {
        TweenLite.to($(".buttonBG"), 0.3, {scale: 1.035, ease:Quad.easeInOut, force3D:false} );     
    },
    ctaMouseout: function () {
        TweenLite.to($(".buttonBG"), 0.3, {scale: 1, ease:Quad.easeInOut, force3D:false} );     
    },
    showPopup: function () {
	    document.getElementById("shader").style.display = "block";
        document.getElementById("popup").style.display = "block";
        TweenLite.to("#shader", 0.5, {alpha:0.6});
        TweenLite.to("#popup", 0.5, {alpha:1});
    },
    hidePopup: function () {
        TweenLite.to("#popup", 0.5, {alpha:0});
        TweenLite.to("#shader", 0.5, {alpha:0});
        setTimeout(function(){document.getElementById("popup").style.display = "none";}, 550);
        setTimeout(function(){document.getElementById("shader").style.display = "none";}, 550);        
        App.returnTimer();
    },
    pauseAll: function () {
        t1.paused( !t1.paused() );
        t2.paused( !t2.paused() );
        t3.paused( !t3.paused() );
        
        if (t1.paused()) { document.getElementById("pause").innerHTML = "<span>Play</span>"; }
        else { document.getElementById("pause").innerHTML = "<span>Pause</span>"; }
    },
    returnTimer: function () {
        App.stopWatch = ((new Date().getTime()) - App.stopWatch) * .001;
        console.log(App.stopWatch + " seconds");
    },

    /* Experience Logic */
    initExperience: function () {
        App.stopWatch = new Date().getTime();
        App.anim1();
    },
    anim1: function() {
  	    setTimeout(function(){document.getElementById("legalButton").style.display = "block";}, 3000);
	    t1.add([TweenLite.to("#copy1A", 0.5, {delay:0.2, left:250, ease:Quad.easeOut} ),
		    TweenLite.to("#copy1B", 0.5, {delay:1.7, left:250, ease:Quad.easeOut} )
	    ]);
	    t1.add([TweenLite.to("#bg-stripe", 0.75, {delay:0.0, left:0, ease:Quad.easeIn, onComplete:App.anim2} )
	    ], "+=3");
	},
	anim2: function() {    
		t2.add([TweenLite.to("#copy2A", 0.5, {delay:0.0, left:0, ease:Quad.easeOut} ),
			TweenLite.to("#copy2B", 0.5, {delay:0.1, left:0, ease:Quad.easeOut} ),
			TweenLite.to("#phoneBlack", 0.5, {delay:0.5, top:0, ease:Quad.easeOut} ),
			TweenLite.to("#phoneGold", 0.5, {delay:0.8, top:0, ease:Quad.easeOut} ),
			TweenLite.to("#copy2C", 0.75, {delay:1.2, left:0, ease:Quad.easeOut} ),
			TweenLite.to("#copy2D", 0.75, {delay:1.7, alpha:1, ease:Linear.easeNone} ),
			TweenLite.to("#ltd1", 0.5, {delay:1.2, alpha:0.7, ease:Linear.easeNone} )			
		]);	 
        t2.add([TweenLite.to("#copy2C", 0.5, {delay:0.0, scale:60, top:"-=100", left:"+=200", ease:Expo.easeIn} ),
        	TweenLite.to("#bg-white", 0.5, {delay:0.0, alpha:1, ease:Expo.easeIn} ),
        	TweenLite.to("#globe-white", 0.4, {delay:0.1, alpha:0, ease:Linear.easeNone} ),
        	TweenLite.to("#globe-blue", 0.4, {delay:0.1, alpha:1, ease:Linear.easeNone} ),
			TweenLite.to("#ltd1", 0.5, {delay:0.1, alpha:0, ease:Linear.easeNone, onComplete:App.anim3} )
		], "+=2.5");
    },
    anim3: function() {
	    t3.add([TweenLite.to("#copy3A", 0.5, {delay:0.0, left:0, ease:Quad.easeOut} ),
	    	TweenLite.to("#copy3B", 0.5, {delay:0.5, top:14, ease:Quad.easeOut} ),
	    	TweenLite.to("#copy3C", 0.5, {delay:0.7, top:14, ease:Quad.easeOut} ),
	    	TweenLite.to("#copy3D", 0.5, {delay:1.2, left:0, ease:Quad.easeOut} ),
	    	TweenLite.to("#ltd2", 0.5, {delay:1.2, alpha:0.8, ease:Linear.easeNone} )
	    ]);	
	    t3.add([TweenLite.to("#buttonContainer", 0.5, {alpha:1} )
	    ], "+=0.5");
	    t3.add(TweenLite.delayedCall(0.1, App.finalAnim) );
    },
    finalAnim: function() {
        App.returnTimer();
    }
}

