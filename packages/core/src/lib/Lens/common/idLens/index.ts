import attributeLens from '../attributeLens';

type HasId = {
  id: string;
};

const lens = attributeLens<HasId, 'id'>('id');

export default lens;
