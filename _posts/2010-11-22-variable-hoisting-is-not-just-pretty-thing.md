---
layout: post
title: Variable declaration at the top is not just pretty thing
---

I was discussing JavaScript code with a friend and he noticed that I had declared all the variable at the top. 

He likes to declare the variable where they are used to be sure that the variable being used is declared with var otherwise that variable will become global variable. This fear of accidentally creating a global variables wants him to see variable declaration next to where it is being used.

## Use the right tool ##

    .....
    var payment;
    payment = soldPrice + shippingCost;
    .....

In the above case user has declared payment variable in the middle so that he is sure that payment is declared. However if there is a typo as given below then he has accidentally created a global variable. 

    .....
    var paymnet; //there is a typo
    payment = soldPrice + shippingCost;
    .....

Having variable declaration next to where variable is being used is not a safe way of guarnateeing that variable is declared. Use the right tool and that would be [jslint](http://www.jslint.com/) validation. I use MacVim and I use [Javascript Lint](http://www.javascriptlint.com/). So every time I save a JavaScript file validation is done and I get warning if I am accidentally creating a global variable. 

You can configure such that JSLint validation runs when you check your code into git or when you push to github. Or you can have a custom rake task. Many solutions are available choose the one that fits you. But do not rely on manual inspection.

## variable declaration are being moved to the top by the browser ##

Even though you have declaration variables next to where they are being used, browsers lift those declarations to the very top. A code like this

    name = 'Neeraj';
    function lab(){
     console.log(name);
     var name = 'John';
     console.log(name);
    };
    lab();

is converted into this by the browser.

    name = 'Neeraj';
    function lab(){
     var name = undefined;
     console.log(name);
     name = 'John';
     console.log(name);
    };
    lab();

In order to avoid this kind of mistakes it is preferred to declared variables at the top like this.

    name = 'Neeraj';
    function lab(){
     var name = 'John';
     console.log(name);
     console.log(name);
    };
    lab();


Also remember that scope of variable in JavaScript at the function level.

## Implications on how functions are declared ##

There are two ways of declaring a function.

    var myfunc = function(){};
    function myfunc2(){};

In the first case only the variable declaration <tt>myfunc</tt> is getting hoisted up. The defintion of myfunc is *NOT* getting hoisted. In the second case both variable declaration and function defintion is getting hoisted up. For more information on this refer to my [previous blog on the same topic](http://www.neeraj.name/2010/03/15/two-ways-of-declaring-functions.html). 
