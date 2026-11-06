/**
 * Equipo de la Secretaría de Energía. Lo usan la sección "Titular y equipo técnico" de la portada
 * y las páginas /equipo/[slug].
 *
 * Solo las personas con `profile` tienen página propia: su contenido sale de la semblanza que
 * entregó cada una, sin agregar nada. Juan Gómez aún no tiene página: su biografía está pendiente
 * de verificar.
 */

export interface TeamProfile {
  /** Cargo y responsabilidades dentro de la Secretaría */
  roles: string[]
  education?: string[]
  experience?: string[]
  /** Visión o línea de acción, en sus propias palabras */
  statement?: { title: string; paragraphs: string[] }
  quote?: string
}

export interface TeamMember {
  slug: string
  initials: string
  name: string
  pos: string
  badge: string
  bg: string
  photo?: string
  /** Resumen de la tarjeta de la portada */
  desc: string
  profile?: TeamProfile
}

export const TEAM: TeamMember[] = [
  {
    slug: 'juan-gomez',
    initials: 'JG',
    name: 'Ing. Juan Gomez',
    pos: 'Secretario de Energía',
    badge: 'Titular',
    bg: 'linear-gradient(135deg,#0a2e19,#1a6b3c)',
    photo: '/team/juan-gomez.jpg',
    desc: 'Doctor en Ingeniería Eléctrica con más de 20 años de experiencia en política energética regional. Ex-director de la CDEEE y consultor de organismos multilaterales en materia de transición energética.',
  },
  {
    slug: 'raul-herrera',
    initials: 'RH',
    name: 'Ing. Raúl Herrera',
    pos: 'Vicesecretario · Encargado de la Mesa de Combustibles',
    badge: 'Vicesecretario',
    bg: 'linear-gradient(135deg,#0f4526,#2d9e5f)',
    photo: '/team/raul-herrera.jpg',
    desc: 'Ingeniero químico (UASD) con posgrado en Alta Gerencia de Producción (INTEC). Fue encargado de Refinación en la Comisión Nacional de Energía, director de Hidrocarburos de la Dirección General de Aduanas (2008-2015) y asesor de Hidrocarburos de la CNE. Consultor ambiental y director general de Rojacha Consulting.',
    profile: {
      roles: [
        'Vicesecretario de la Secretaría de Energía de la Fuerza del Pueblo',
        'Encargado del Área de Combustibles (Mesa de Combustibles)',
      ],
      education: [
        'Ingeniería Química, Universidad Autónoma de Santo Domingo (UASD), 1986',
        'Posgrado en Alta Gerencia de Producción, Universidad INTEC, 1987-1989',
        'Estudios en Evaluación de Proyectos, UASD',
        'Estudios de inglés, Modern English College, 1984-1986',
        'Estudios y entrenamientos en Gas Natural, instituto WCW, Houston, Texas, 2005',
      ],
      experience: [
        'Director General de la firma independiente Rojacha Consulting, S.R.L., consultora y asesora energética, ambiental y de inversiones (actualidad)',
        'Consultor Ambiental Autorizado (código 03-227), con más de 600 trabajos ambientales realizados desde 2003 e igual número de licencias y permisos ambientales gestionados',
        'Asesor de Hidrocarburos del Director de la Comisión Nacional de Energía (CNE), 2015-2020',
        'Director de Hidrocarburos de la Dirección General de Aduanas, 2008-2015',
        'Estudio técnico para el desarrollo de una nueva refinería de alta conversión para la CNE, 2005-2006',
        'Encargado de Refinación de la Dirección de Hidrocarburos de la Comisión Nacional de Energía (CNE), 2004-2008',
      ],
      statement: {
        title: 'Línea de acción',
        paragraphs: ['Trabajar y contribuir al mejoramiento del subsector de los combustibles en la República Dominicana.'],
      },
    },
  },
  {
    slug: 'leocadio-lebron',
    initials: 'LL',
    name: 'Ing. Leocadio Lebrón Jiménez',
    pos: 'Encargado de la Mesa de Generación',
    badge: 'Mesa de Generación',
    bg: 'linear-gradient(135deg,#134e2a,#3db870)',
    photo: '/team/leocadio-lebron.jpg',
    desc: 'Ingeniero industrial, licenciado en Derecho y máster en Alta Dirección Pública, con 40 años de trayectoria en el sector eléctrico. «¡Sin electricidad no se alcanza el desarrollo!»',
    profile: {
      roles: ['Encargado de la Mesa de Generación de la Secretaría de Energía de la Fuerza del Pueblo'],
      education: [
        'Ingeniero Industrial',
        'Licenciado en Derecho',
        'Maestría (M. Sc.) en Alta Dirección Pública',
      ],
      experience: ['40 años relacionado con los temas eléctricos'],
      statement: {
        title: 'Sobre la generación eléctrica',
        paragraphs: [
          'La producción de electricidad constituye el primer pilar para los sistemas eléctricos garantizar el desarrollo económico y social de los países. Debe contar con una matriz energética diversificada, con una reserva adecuada, que garantice el abastecimiento de la demanda de energía a los usuarios, de manera continua, estable, a precio competitivo y ambientalmente sostenible.',
        ],
      },
      quote: '¡Sin electricidad no se alcanza el desarrollo!',
    },
  },
  {
    slug: 'nelson-perdomo',
    initials: 'NP',
    name: 'Ing. Nelson Perdomo',
    pos: 'Coordinador de la Mesa de Distribución',
    badge: 'Mesa de Distribución',
    bg: 'linear-gradient(135deg,#0a2e19,#2d9e5f)',
    photo: '/team/nelson-perdomo.jpg',
    desc: 'Ingeniero mecánico electricista (UASD) con maestría en Regulación Económica de la Industria Eléctrica. Experiencia en fiscalización de la calidad del servicio de distribución y comercialización de las empresas distribuidoras, y en consultoría y ejecución de proyectos eléctricos.',
    profile: {
      roles: ['Coordinador de la Mesa de Distribución de la Secretaría de Energía de la Fuerza del Pueblo'],
      education: [
        'Ingeniero Mecánico Electricista, Universidad Autónoma de Santo Domingo (UASD)',
        'Maestría en Regulación Económica de la Industria Eléctrica',
        'Especialidades en Gerencia de Proyectos y en Desarrollo Organizacional',
      ],
      experience: [
        'Fiscalización de la calidad del servicio de distribución y comercialización de las empresas distribuidoras',
        'Consultoría y ejecución de proyectos eléctricos',
      ],
    },
  },
]

export function getMember(slug: string): TeamMember | undefined {
  return TEAM.find(m => m.slug === slug)
}

/** Personas con página propia */
export const PROFILED = TEAM.filter(m => m.profile)
