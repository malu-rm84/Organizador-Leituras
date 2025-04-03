
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating = ({ rating, size = 24, editable = false, onChange }: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const renderStars = () => {
    const stars = [];
    
    // Create full stars
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={`star-${i}`}
            size={size}
            fill="currentColor"
            className={editable ? "cursor-pointer" : ""}
            onClick={() => editable && onChange && onChange(i + 1)}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf
            key={`star-half-${i}`}
            size={size}
            fill="currentColor"
            className={editable ? "cursor-pointer" : ""}
            onClick={() => editable && onChange && onChange(i + 0.5)}
          />
        );
      } else {
        stars.push(
          <Star
            key={`star-empty-${i}`}
            size={size}
            className={`${editable ? "cursor-pointer" : ""} text-gray-400`}
            onClick={() => editable && onChange && onChange(i + 1)}
          />
        );
      }
    }
    
    return stars;
  };
  
  return (
    <div className="star-rating">
      {renderStars()}
    </div>
  );
};

export default StarRating;
