import test from 'ava';
import { configureStore } from '../src/store';
import Resource from '../src/resource';

const db = configureStore();

test('new Resource() should store _id, _type, _payload', t => {
  const record = new Resource(124, 'product', { data: 'xyz' });

  t.is(record._id, 124);
  t.is(record._type, 'product');
  t.same(record._payload, { data: 'xyz' });
});

test('new Resource() should accept id as String, too', t => {
  const record = new Resource('124', 'product', { data: '123' });

  t.same(record._id, '124');
});

test('new Resource() should have [] relations', t => {
  const record = new Resource();

  t.is(Array.isArray(record._relationships), true);
  t.is(record._relationships.length, 0);
});

test('isResource should correctly detect non-model Objects', t => {
  const record = new Resource(1, 'devices', {
    product: 'iPhone',
    version: '6'
  })

  const err = new Error('Something went wrong.');

  t.true(Resource.isResource(record));
  t.false(Resource.isResource(err));
});

test('toResource should transforms model to relation format', t => {
  const record = new Resource(3, 'phones', {
    product: 'iPhone',
    version: 6
  });

  t.same(Resource.toResource(record), {
    id: 3,
    type: 'phones'
  });
});

test('Resource should provide aliases for _members', t => {
  const record = new Resource(125, 'category', { data: '02292016' });

  t.is(record.id, 125);
  t.is(record.type, 'category');
  t.same(record.relationships, []);
});

test('get() should allow easy access to _payload', t => {
  const record = new Resource(123, 'release', {
    title: 'Meander',
    published: { year: 1995 }
  });

  t.is(record.get('title'), 'Meander');
  t.is(record.get('published.year'), 1995);
  t.is(record.get('xyz'), undefined);
});

test('get() without a key returns _payload', t => {
  const record = new Resource(138, 'release', {
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
  const record = new Resource(456, 'release', {
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
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(track);

  t.same(release._relationships, [
    { id: 2, type: 'tracks' }
  ]);
});

test('add() should create a new relationship', async t => {
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(track);
  release.remove(track);

  await db.save(release);
  await db.save(track);

  t.same(release._relationships, []);
});

test('add() should also receive id, type explicitly', t => {
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(2, 'tracks');
  
  t.same(release._relationships, [{
    id: 2, type: 'tracks'
  }]);
});

test('remove() should also receive id, type explicitly', t => {
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  release.add(track);
  release.remove(2, 'tracks');

  t.same(release._relationships, []);
});

test('load() should return matching relationships', async t => {
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  const track2 = new Resource(3, 'tracks', {
    title: 'Paloma'
  });

  release.add(track);
  release.add(track2);

  await db.save(track)
  await db.save(track2);

  t.is(release.relationships.length, 2);

  const query = release.load(3, 'tracks');
  const related = await db.find(query);

  t.is(related.get('title'), 'Paloma');
});

test('unload() dereferences a given relationship', t => {
  const release = new Resource(1, 'releases', {
    title: 'Indian Summer Revisited'
  });

  const track = new Resource(2, 'tracks', {
    title: 'One Prairie Outpost'
  });

  const track2 = new Resource(3, 'tracks', {
    title: 'Paloma'
  });

  release.add(track);
  release.add(track2);

  t.is(release.relationships.length, 2);

  release.unload(track);

  t.is(release.relationships.length, 1);
});

test('toJSON() converts the Resource for saving', t => {
  const record = new Resource(197, 'track', {
    title: 'Clockwork'
  });

  t.same(record.toJSON(), {
    id: 197,
    type: 'track',
    title: 'Clockwork',
    relationships: [],
    refreshed_at: undefined
  });
});
