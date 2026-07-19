interface StarRatingProps {
  difficulty: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ difficulty, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= difficulty ? 'text-yellow-400' : 'text-gray-600'}>
          ★
        </span>
      ))}
    </div>
  );
}
