# Waterline 2.0

> **Please do not use this module in production.**
>
> Waterline2 is not currently ready for production use and is not actively maintained.  _It is only a proposal_ at this point.
>
> Instead, check out the [current stable version of Waterline](https://github.com/balderdashy/waterline).  It is actively developed and is the core team's main focus.



Still curious?  Okay.  First, see [Introduction to Waterline2](./Introduction to Waterline2.pdf) for background on what this even is.  Then see see ROADMAP.md for what's planned and the contribution guidelines.  Feel free to send suggestions, etc. as PRs.  If you've caught the bug and are interested in becoming a bigger part of the project, please reach out to @mikermcneil, @particlebanana, or @sgress454 on Twitter.

If you're feeling experimental, you [can actually use parts of WL2 in your existing Sails app right now](./USAGE_WITH_SAILS), as long as you're using the >=0.10.x version of Waterline and/or Sails.  There are some pretty heavy crutches involved, and it's not particularly easy to set up right now, but cool to see nonetheless.  And obviously extremely important for testing if you're looking to get involved as a contributor.  Check out [USAGE_WITH_SAILS.md](./USAGE_WITH_SAILS.md) for details.  As long as you're comfortable with `npm link`, you should have no problem getting it to work.



## Usage

First, clone this repo and run npm install.  Then do:

```sh
$ node
```

And:

```js
var Waterline = require('./');
```

## Making Some ORM(s)

Simple:

```js
var orm1 = Waterline();

console.log(orm1);

//------[ORM]------
// • 0 model(s)
// • 0 datastore(s)
// • 0 adapter(s)
//-----------------
```




By specifying an object of arrays of definition objects:

```js
var orm2 = Waterline({
  models: [{ identity: 'parakeet'}]
});

console.log(orm2);

//------[ORM]------
// • 1 model(s)
// • 0 datastore(s)
// • 0 adapter(s)
//-----------------

```



By specifying an object of objects of definition objects:

```js
var orm3 = Waterline({
  models: {
    werewolf: {},
    parakeet: {
      attributes: {}
    },
    pustule: {},
    automobile: {}
  },
  datastores: { myFooDb: {} },
  adapters: { 'wl-myfoo': {} }
});


console.log(orm3);

//------[ORM]------
// • 4 model(s)
// • 1 datastore(s)
// • 1 adapter(s)
//-----------------

// In this case, each set of definitions is converted into an array
// of instantiated Waterline entities, inferring the `identity` from the key name.
// i.e., orm3.models[0].identity === 'werewolf'

```


## Working with models, datastores, adapters at runtime

When entities are **changed** at runtime, you should use the _methods_ below. Otherwise, you can change `yourOrm.models`, `yourOrm.adapters`, etc. directly, just be sure and call `yourOrm.refresh()` afterwards.

> **NOTE:**
>
> This does not do any adapter-level data migration- it simply cleans up any events, etc.  It could be eliminated as a necessary step in the future (and use getters and setters instead), but I think it's better to make this sort of thing explicit.

##### Get your models

```js

console.log(orm3.models);

/*
[ ------[Model <werewolf>]------
  { attributes: {} }
  ------------------------------,
  ------[Model <parakeet>]------
  { attributes: {} }
  ------------------------------,
  ------[Model <pustule>]------
  { attributes: {} }
  -----------------------------,
  ------[Model <automobile>]------
  { attributes: {} }
  -------------------------------- ]
  */


// Or get an individual model:
var Parakeet = orm3.model('parakeet');

// This is basically the same as doing:
// _.find(orm3.models, { identity: 'parakeet' });

console.log(Parakeet);
/*
------[Model <parakeet>]------
  { attributes: {} }
  ------------------------------
*/
```

##### Get your datastores or adapters

```js
orm3.datastores;
/*
[ ------[Datastore <myFooDb>]------
  { identity: 'myFooDb' }
  -------------------------------- ]
*/

var MyFooDb = orm.datastore('myFooDb');
```


```
orm3.adapters;

/*
[ ------[Adapter <wl-myfoo>]------
  { identity: 'wl-myfoo' }
  -------------------------------- ]
*/

// Or get an individual adapter:
var MyFooAdapter = orm.adapter('wl-myfoo');
```

##### Identify a new model, datastore, or adapter

Will override what's already there if something else exists w/ the same identity.

```js
orm3.identifyModel('pickle', {});
orm3.identifyDatastore('ram', {});
orm3.identifyAdapter('sails-memory', {});
```

##### "Forget" a model, datastore or adapter
```js
orm3.forgetModel('werewolf');
orm3.fogetDatastore('myFooDb');
orm3.forgetAdapter('wl-myfoo');
```


## Querying

Waterline2 adds a lot of cool stuff.  I won't get to it all here.  But realize that you can still query things like you're used to:


###### Standard usage (node callback)
```js
User.find().exec(function (err, users){...})
```

###### Node callback as last argument

```js
User.find(function (err, users){...})
```

###### Promises
(but now you can plug in your own promise library)

```js
User.find()
.then(function (users){...})
.catch(function (err){...})
```

###### Switchbacks
(but now you can disable them or plug in your own EventEmitter)

```js
User.find().exec({
  success: function (users) {...}
  error: function (err) {...},
})
```


### Populates

As you probably know, Waterline supports populate queries (i.e. joins).

```js
// Look up User #6 and populate her files
User.findOne(6).populate('files').then(function (user6) {
  // user6.canAccess => [{...}, {...}, ...]
});
```


You can also filter/sort/paginate/project the results of each populated result set (on a per-parent-record-basis) by using the second argument to populate:

```js
// Find a list of all users between the ages of 45 and 55
// and populate their 5 most overdue book checkouts that took place
// at branch #37
User.find()
.where({
  age: {
    '>=': 45,
    '<=': 55
  }
})
.populate('checkouts', {
  where: { branch: 37 },
  limit: 5,
  sort: 'dueDate ASC'
})
.then(function (users) {
  // users.checkouts => [{...}, {...}, ...]
})
```


But in WL2, the normalized criteria syntax looks a little different than it used to for that type of query:

```js
{
  from: {entity: 'model', identity: 'user'},
  where: {},
  limit: undefined,
  skip: 0,
  sort: {},
  select: {
    '*': true,
    checkouts: {
      from: {entity: 'model', identity: 'librarycheckout'},
      select: { '*': true },
      where: { branch: 37 },
      limit: 5,
      skip: 0,
      sort: { dueDate: 1 }
    }
  }
}
```

And as you might be thinking, what that means is that now (at last!), populates can be infinitely nested.

A simple example:

```js
// Look up User #6 and populate her files
// (but now let's assume there is an intermediate model, i.e. "Permission")
User.findOne(6).populate('canAccess.files').then(function (user6) {
  // user6.canAccess => [{...}, {...}, ...]
  // user6.canAccess[0].files => [{...}, {...}, ...]
})
```



You can even filter/sort/paginate/project _nested_ populates, as deep as you like.  You cannot, (with _only this method_ at least) filter intermediate populates (i.e. if the Permission model had a `type` attribute, and we wanted to populate only those files associated via a `type:"read"` permission).

But we _can_ do it with WHERE subqueries.  Read on for more about that.




### WHERE Subqueries

With Waterline2, the ORM now supports WHERE subqueries.


```js
var now = new Date();

// Find all users with overdue library checkouts
User.find()
.where({
  checkouts: {
    dueDate:  { '<': now }
  }
})
.then(function (naughtyUsers){
  // naughtyUsers
})
```


These subqueries can be infinitely nested:

```js
var now = new Date();

// Find all users with overdue library checkouts
User.find()
.where({
  checkouts: {
    dueDate:  { '<': now }
  }
})
.then(function (naughtyUsers){
  // naughtyUsers
})
```


Here's a more complex example, which also uses `.populate()`:

```js
var now = new Date();

// Find the 5 most recent overdue library checkouts that contained
// a book titled "Robinson Crusoe"
LibraryCheckout.find()
limit(5)
.sort('createdAt DESC')
.where({
  dueDate: {'<': now },
  books: {
    title: 'Robinson Crusoe'
  }
})

// (also populate the user who checked out the books so we can
//  send them an email letting them know that their debt will be
//  forgiven if they go to our kid's robinson-crusoe-themed birthday
//  party next week)
.populate('cardholder')
.exec(...)
```


You can combine them with projections, populates.  Here's the fully expanded criteria object for the same query:


```js
{
  select: {
    '*': true,
    books: {

    }
  },
  where: {
    books: {
      whose: { title: 'Robinson Crusoe' },
      min: 1
    }
  },
  limit: 5,
  skip: 0,
  sort: {
    createdAt: -1
  }
}
```



> **NOTE:**
>
> Currently, the means by which parent records are qualified is fairly limited.
> (You really only have one qualifier operator: `min`)
> This syntax be extended over time to include more operators, but in the mean
> time, you can actually pass in a filter function instead.  Note that the filter
> function **must be synchronous** (it returns true to keep or false to reject.)
> To manipulate result sets at runtime depending on an _asynchronous_ operation,
> you must write a custom association rule (AR).
>
> ```js
> // Find users who checked out books whose titles include their first name
> // (Note that this is impossible with the vanilla syntax since there is currently
> // no declarative approach to address the result data from elsewhere in the query)
> User.find()
> .where({
>   checkouts: {
>     books: {
>       '&filter': function ourLittleCustomQualifier (someBook, itsCheckout, itsUser) {
>
>          // Note that if `itsUser.firstName` is `null`, the following would throw.
>          // Luckily, this method is wrapped in a try..catch inside Waterline core.
>          // If it throws, it's ok- the record will just be omitted.
>          return user.firstName.match()
>        }
>     }
>   }
> })
> ```
>
> (WARNING: The filter function approach discussed above not work yet-
>  will update this file when it does. Leaving this note here so I don't have
>  to document it again later.)



## xD/A Queries

When possible (for intra-datastore subqueries), WL2 will use an optimized approach to execute ORM `find`'s with as few queries as possible.

But one of the coolest things about Waterline, and a core philosophy of our team and contributors, is pure database agnosticism.  So to keep with the spirit of that perogative, _cross-datastore and cross-adapter associations/subqueries are supportedin Waterline 2_.

**HOWEVER** this comes at a cost.  The paging necessary to make this work across databases can be slow.  You should be careful and make reasonable decisions about where you house your data.

But the idea is that, when there's no other choice, it's pretty great to be able to rely on Waterline to take care of xD/A data manipulation/querying for you and have it all just work.  Plus, even though there will always be a lot more we could do to optimize the cursor, it's likely to be faster than anything you or I would write ourselves on a one-off basis (because how would you ever get the chance to spend enough time on it, yknow?)


## Advanced

### Constructors

So needless to say, you can always instantiate an ORM and a model, then grab the model instance and get its `.constructor`.  Same thing for Datastore, Adapter, and the ORM constructor itself.  But Waterline also exposes these at the top level for you:

```js
new Waterline.Model();
new Waterline.Datastore();
new Waterline.Adapter();
new Waterline.ORM();
```

### `instanceof` methods

Waterline also provides some static methods for checking whether some input is an instantiated model, datastore, etc.:

```js
Waterline.Model.isModel( someMysteriousThing );
Waterline.Datastore.isDatastore( someMysteriousThing );
Waterline.Adapter.isAdapter( someMysteriousThing );
Waterline.ORM.isORM( someMysteriousThing );
```





### Everything Else

See the source code.  Play around with it, have a good time you know


## Contributing

See [ROADMAP.md](./ROADMAP.md). (it's slightly out of date)


## License

MIT
