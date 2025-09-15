import attributeLens from '../attributeLens';

type HasId = {
  id: string;
};

const idLens = attributeLens<HasId, 'id'>('id');

export default idLens;
