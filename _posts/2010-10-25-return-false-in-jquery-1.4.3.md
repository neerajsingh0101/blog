---
layout: post
title: return false has changed in jquery 1.4.3
---

jQuery 1.4.3 was recently [released](http://blog.jquery.com/2010/10/16/jquery-143-released/). If you upgrade to jQuery 1.4.3 you will notice that the behavior of "return false" has changed in this version. First let's see what "return false" does.

## return false ##

    $('a').click(function(){
      console.log('clicked'); 
      return false;
    });

I will ensure that above code is executed on domready. Now if I click on any link then three two things will happen.

* e.preventDefault() will be called
* e.stopPropagation() will be called

## e.preventDefault() ##

As the name suggets, calling <tt>e.preventDefault()</tt> will make sure that the default beahvior is not executed.

    <a href='www.google.com'>click me</a>

If above link is clicked then the default behavior of the browser is to take you to <tt>www.google.com</tt>. However by invoking <tt>e.preventDefault()</tt> browser will not go ahead with default behavior and I will <strong>not</strong> be taken to <tt>www.google.com</tt>.

## e.stopPropagation ##

When a link is clicked then a "click event" is created. And this event bubbles all the way up to the top. By invoking <tt>e.stopPropagation</tt> I am asking browser to not propagate the event. In other words the event will stop bubbling.

    <div class='first'>
      <div class='two'>
        <a href='www.google.com'>click me</a>
      </div>
    </div>

If I click on "click me" then "click event" will start bubbling. Now let's say that I catch this event at <tt>.two</tt> and if I call <tt>e.stopPropagation()</tt> then ethis event will never reach to <tt>.first</tt> .

## e.stopImmediatePropagation ##

First note that you can bind more than one event to an element. Take a look at following case.

    <a class='one'>one</a>

To the above elemet I am going to bind three events.

    $('a').bind('click', function(e){
      console.log('first');
    });

    $('a').bind('click', function(e){
      console.log('second');
      e.stopImmediatePropagation();
    });

    $('a').bind('click', function(e){
      console.log('third');
    });

So in this case there are three events bound to the same element. Notice that second event binding invokes <tt>e.stopImmediatePropagation()</tt> . Calling <tt>e.stopImmediatePropagation</tt> does two things.

Just like <tt>stopPropagation</tt> it will stop the bubbling of the event. So any parent of this element will not get this event. 

However <tt>stopImmdiatePropagation</tt> stops the event bubbling even to the siblings. It kills the event right then and there. That's it. End of the event.

Once again calling <tt>stopPropagation</tt> means stop this event going to parent. And calling <tt>stopImmediatePropagation</tt> means stop passing this event to sibligns.

#Back to original problem#

Now that I have described what <tt>preventDefault</tt>, <tt>stopPropagation</tt> and <tt>stopImmeidatePropagation</tt> does what changed in jQuery 1.4.3.

In jQuery 1.4.2 when I call "return false" that was same as calling:

* e.preventDefault()
* e.stopPropagation()
* e.stopImmeidatePropagation()

e.stopImmeidatePropagation internally calls <tt>e.stopPragation</tt> but I have added here for visual clarity.

Fact that <tt>return false</tt> was calling <tt>e.stopImmeidatePropagation</tt> was a bug. Get that. It was a bug which got fixed in jquery 1.4.3.

So in jquery 1.4.3 <tt>e.stopImmediatePropagation</tt> is not called. Checkout this piece of code from <tt>events.js</tt> of jquery code base.

    if ( ret !== undefined ) {
      event.result = ret;
      if ( ret === false ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

As you can see when <tt>return false</tt> is invoked then <tt>e.stopImmediatePropagation</tt> is <strong>not</strong> called.
