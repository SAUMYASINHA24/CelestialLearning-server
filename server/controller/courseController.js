const { validationResult } = require('express-validator');
const { Course, Section, Content } = require('../models/courseModel');
const asyncHandler = require('express-async-handler');
const {Subscriber, SubscribedCourses, Order, SubscriberProfile} = require('../models/subscriberModel');
const { Author, AuthorProfile } = require("../models/authorModel");
const shortid = require('shortid')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const {Feedback} = require('../models/assessmentModel')

//url: /course/details
exports.courseDetails = asyncHandler(async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400);
        return res.json({
            message: errors.array()[0].msg
        });
    }
    const { courseTitle } = req.body;
    
    const course = await Course.findOne({ title: courseTitle });
    const content = await Content.findOne({ _id: course.content });
    const sectionsId = content.section;
    const sectionData = [];
    for (i = 0; i < sectionsId.length; i++) {
        const sectionsData = await Section.findOne({ _id: sectionsId[i] });
        sectionData.push({
            "sectionNumber": sectionsData.number,
            "sectionName": sectionsData.sectionName
        });
    }
    const author = await Author.findOne({ _id: course.author });
    const profile = await AuthorProfile.findOne({ _id: author.profile_id });
    res.status(200);
    return res.json({
        title: course.title,
        price: course.price,
        suitableFor: course.suitableFor,
        description: course.description,
        category: course.category,
        prerequisite: course.prerequisite,
        authorName: `${profile.firstName} ${profile.middleName} ${profile.lastName}`,
        sectionData,
        courseThumbnail: `https://celestiallearning.s3.amazonaws.com/${course.courseSlug}/${course._id}_thumbnail.${course.thumbnailExtension}`,
        coursePreview: `https://celestiallearning.s3.amazonaws.com/${course.courseSlug}/${course._id}_preview.${course.previewExtension}`
    })
})

//url : course/feeback
exports.acceptFeedback = asyncHandler(async(req,res)=>{

    const {courseName, feedback, stars} = req.body;
    const email = req.session.email;
    const subscriber = await Subscriber.findOne({email})
    const oldFeedback = await Feedback.find({$and:[{subscriber:subscriber._id},{courseName}]})
    if(oldFeedback.length>0)
    {
        res.status(200)
        return res.json({
            alert: "You have already submitted the review.Thanks!"
        })
    }
    const feedbackObject = new Feedback({
        courseName,
        feedback,
        stars,
        subscriber : subscriber._id
    })
    await feedbackObject.save();
    res.status(200)
    return res.json({
        message : "Feedback is submitted"
    })

})