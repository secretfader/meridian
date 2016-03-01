import test from 'ava';
import { configureStore } from '../src/store';
import Model from '../src/model';

const db = configureStore();

test('new Model() should store _id, _type, _payload', t => {
  const record = new Model(124, 'product', { data: 'xyz' });

  t.is(record._id, 124);
  t.is(record._type, 'product');
  t.same(record._payload, { data: 'xyz' });
});

test('new Model() should have [] relations', t => {
  const record = new Model();

  t.is(Array.isArray(record._relationships), true);
  t.is(record._relationships.length, 0);
});

test('Model should provide aliases for _members', t => {
  const record = new Model(125, 'category', { data: '02292016' });

  t.is(record.id, 125);
  t.is(record.type, 'category');
});

test('get() should allow easy access to _payload', t => {
  const record = new Model(123, 'release', {
    title: 'Meander',
    published: { year: 1995 }
  });

  t.is(record.get('title'), 'Meander');
  t.is(record.get('published.year'), 1995);
  t.is(record.get('xyz'), undefined);
});

test('get() without a key returns _payload', t => {
  const record = new Model(138, 'release', {
    title: 'Living Things',
    artist: {
      name: 'Linkin Park'
    }
  });

  t.is(record.get('artist.name'), 'Linkin Park');
  t.same(record.get(), {
    title: 'Living Things',
    artist: { name: 'Linkin Park' }
  });
});

test('set() assigns new _payload data', t => {
  const record = new Model(456, 'release', {
    title: 'Nothing Rhymes With Woman'
  });

  t.is(record.get('artist'), undefined);
  record.set('artist', 'Carbon Leaf');
  t.is(record.get('artist'), 'Carbon Leaf');

  t.is(record.get('published.year'), undefined);
  record.set('published.year', 2009);
  t.is(record.get('published.year'), 2009);
});

test('add() should create a new relationship', t => {
  const release = new Model(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Model(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(track);

  t.same(release._relationships, [
    { id: 2, type: 'tracks' }
  ]);
});

test('add() should create a new relationship', t => {
  const release = new Model(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Model(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(track);
  release.remove({ id: 2, type: 'tracks' });

  t.same(release._relationships, []);
});

test('toJSON() converts the Model for saving', t => {
  const record = new Model(197, 'track', {
    title: 'Clockwork'
  });

  t.same(record.toJSON(), {
    id: 197,
    type: 'track',
    title: 'Clockwork'
  });
});

test('save() should return a valid Model instance', async t => {
  const record = new Model(587, 'singles', {
    title: 'Miss Hollywood'
  });

  const saved = await db.save(record);

  t.true(saved instanceof Model); 
  t.is(saved.get('title'), 'Miss Hollywood');
  t.is(saved.get('xyz'), undefined);
});

test('Model.find() should return existing documents', async t => {
  const record = new Model(598, 'singles', {
    title: 'Life Less Ordinary'
  });

  const saved = await db.save(record);
  const found = await db.find(598, 'singles');

  t.is(saved.get('title'), found.get('title'));
  t.is(found.get('xyz'), undefined);
});

