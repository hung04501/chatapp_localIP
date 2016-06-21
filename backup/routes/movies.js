var Movie=require('../models/movie');
var express=require('express');

//configure routes

var router=express.Router();

	//	http://mongoosejs.com/docs/2.7.x/docs/query.html
	
router.route('/movies')
	.get(function (req, res) {
		//var query = Movie.find({releaseYear: req.query.releaseYear }); 
		//query.where('title').equals(req.query.title);
		//query.where('releaseYear').gt(2017);
		//gte(2016).lte(2014)
		
		var query = Movie.find({title: req.query.title }); 
		//query.where('title').equals(req.query.title);
		query.where('releaseYear').gt(2017);
		//gte(2016).lte(2014)
	
		query.exec(function (err, results) {
		  if (!err) {
			return res.send(results);
		  } else {
			return console.log(err);
		  }
		});
	})
	 .post(function(req,res){
        var movie=new Movie(req.body);
        movie.save(function(err){
            if(err)
                res.send(err);
            res.send({message:'Movie Added'});
        });
    });
	
	
	
	
router.route('/movies/:id')
    .put(function(req,res){
        Movie.findOne({_id:req.params.id},function(err,movie){

            if(err)
                res.send(err);

           for(prop in req.body){
                movie[prop]=req.body[prop];
           }

            // save the movie
            movie.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Movie updated!' });
            });

        });
    })

    .get(function(req,res){
        Movie.findOne({_id:req.params.id},function(err, movie) {
            if(err)
                res.send(err);

            res.json(movie);
        });
    })

    .delete(function(req,res){
        Movie.remove({
            _id: req.params.id
        }, function(err, movie) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

module.exports=router;
