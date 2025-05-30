import Joi from 'joi';

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      
      return res.status(400).json({
        status: 'error',
        errors,
      });
    }
    
    next();
  };
};

export default validateRequest;