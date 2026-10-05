const e=`
  acorn acres actor agate air albatross almond amber anchor angle animal antler apple apron archer
  arctic arrow artist aspen atlas autumn avenue badge bagel bamboo banana band banner bark barn
  barrel basil basket bay beach bean bear beaver beetle bell berry birch bird bison blanket bloom
  blossom blue boat book border bottle boulder bowl branch brass bread breeze brick bridge brook
  brush bubble bucket bud buffalo butter button cabin cactus cake camel camera camp candle canyon
  cape captain carrot castle cat cedar celery chalk cherry chess chest chick chisel circle citrus
  clam clay cliff clock cloud clover coast cocoa coconut coffee comet coral cork cotton cove
  coyote crab crane creek crest cricket crown crystal cube cup curry cypress daisy dawn deer delta
  desert dew diamond diner dolphin dome donkey door dove dragon dream drift drum duck dune dusk
  eagle earth east echo edge elm ember emerald falcon farm feather fern ferry field fig finch fir
  fire fish flag flame flannel flax flint float flock flora flower flute foam forest fork fossil
  fountain fox frost fruit fudge galaxy garden garlic garnet gate gazelle gecko gem ginger glass
  globe glow goat gold goose grain grape grass gravel green grove gull harbor hare harp harvest
  hat haven hawk hazel heart heath hedge heron hill hive holly honey hoof horizon horn horse hotel
  hound house hummingbird hyacinth ibis ice igloo ink inlet iris island ivory ivy jacket jade
  jaguar jam jar jasmine jay jelly jewel jigsaw journal joy juniper kale kangaroo kayak kelp
  kettle key kiwi kite kitten koala lagoon lake lamb lamp lantern lark lava lawn leaf leek lemon
  leopard lilac lily lime linen lion lizard llama loaf lobster log lotus lunar lynx magnet magpie
  mango maple marble mare market marsh meadow melon mint mirror mist mitten moon moose moss moth
  mountain mouse mug mushroom music mussel mustard nectar needle nest nettle night north note
  nutmeg oak oasis oat ocean olive onion opal orange orbit orchid otter owl oyster paddle page
  palm panda paper parcel parrot parsley pasta patch path peach pearl pebble pecan pelican pencil
  pepper petal piano pickle pie pigeon pine pink pipit planet plant plum pocket pond pony poplar
  poppy porch potato prairie prism puffin pumpkin purple puzzle quail quartz queen quilt quince
  rabbit raccoon radish rail rain rainbow raven ray reed reef ridge ring river robin rock rocket
  root rope rose rowan ruby rug sage sail salad salmon sand satin saucer scarf sea seal seed shade
  shark shawl sheep shell shield ship shoal shore shrimp silver sky slate sleet slope snail snake
  snow soap sock sofa soil song sorrel south sparrow spice spoon spring spruce square squirrel
  star steam steel stem stone stork storm stream sugar summer summit sun sunset surf swan sweet
  swift sycamore table taco tail talon tangerine tea teal temple tent tern terra thorn thyme tide
  tiger tile timber toast toffee tomato torch tower trail tree trout tulip tuna tunnel turtle twig
  umber valley vanilla vase velvet vine viola violet vista vole wagon walnut wasp water wave wax
  weasel web west whale wheat wheel willow wind window wing winter wolf wood wool wren yam yard
  yellow yew zebra zinc zinnia
`.trim().split(/\s+/);function l(r=4){const o=Math.floor(4294967296/e.length)*e.length;return Array.from(crypto.getRandomValues(new Uint32Array(r)),a=>{for(;a>=o;)a=crypto.getRandomValues(new Uint32Array(1))[0];return e[a%e.length]}).join("-")}export{l as r};
