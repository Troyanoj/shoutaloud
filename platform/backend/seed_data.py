"""Seed data for development and testing."""
import logging
import traceback
from datetime import datetime, timedelta
from core.database import SessionLocal
from models.user import User
from models.proposal import Proposal
from models.official import Official
from models.tag import Tag
from models.comment import Comment

logger = logging.getLogger(__name__)


def seed_data():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        logger.info(f"Current user count: {user_count}")

        if user_count > 0:
            logger.info("Database already has data, skipping seed")
            return

        logger.info("Seeding database with sample data...")

        # Users
        users = [
            User(
                did="did:shout:seed_admin",
                identity_commitment="did:shout:seed_admin",
                email="admin@shoutaloud.org",
                full_name="Administrador",
                municipality_code=1,
                state_code=1,
                is_verified=True,
                is_active=True,
                reputation_score=100.0,
            ),
            User(
                did="did:shout:seed_user1",
                identity_commitment="did:shout:seed_user1",
                email="maria@ejemplo.com",
                full_name="María García",
                municipality_code=1,
                state_code=1,
                is_verified=True,
                is_active=True,
                reputation_score=45.0,
            ),
            User(
                did="did:shout:seed_user2",
                identity_commitment="did:shout:seed_user2",
                email="carlos@ejemplo.com",
                full_name="Carlos López",
                municipality_code=2,
                state_code=1,
                is_verified=True,
                is_active=True,
                reputation_score=30.0,
            ),
        ]
        db.add_all(users)
        db.flush()
        logger.info(f"Created {len(users)} users")

        # Officials
        officials = [
            Official(
                name="Roberto Martínez",
                position="Alcalde Municipal",
                municipality_code=1,
                state_code=1,
                bio="Alcalde electo para el período 2024-2028",
            ),
            Official(
                name="Ana Rodríguez",
                position="Diputada Local",
                municipality_code=1,
                state_code=1,
                bio="Representante del distrito 5",
            ),
            Official(
                name="Pedro Sánchez",
                position="Gobernador",
                municipality_code=0,
                state_code=1,
                bio="Gobernador del estado",
            ),
        ]
        db.add_all(officials)
        db.flush()
        logger.info(f"Created {len(officials)} officials")

        # Tags
        tags = [
            Tag(name="transparente", category="positive", description="Propuesta clara y abierta"),
            Tag(name="innovador", category="positive", description="Solución creativa"),
            Tag(name="urgente", category="neutral", description="Requiere atención inmediata"),
            Tag(name="costoso", category="negative", description="Alto presupuesto requerido"),
            Tag(name="popular", category="positive", description="Amplio apoyo ciudadano"),
            Tag(name="viável", category="positive", description="Fácil de implementar"),
        ]
        db.add_all(tags)
        db.flush()
        logger.info(f"Created {len(tags)} tags")

        # Proposals
        now = datetime.utcnow()
        proposals = [
            Proposal(
                title="Mejorar el transporte público municipal",
                summary="Propuesta para renovar la flota de autobuses y crear rutas eficientes",
                content="Se propone la renovación completa de la flota de autobuses urbanos, la creación de 5 nuevas rutas que conecten las zonas periféricas con el centro, y la implementación de un sistema de rastreo GPS en tiempo real accesible desde una app móvil.\n\nEl presupuesto estimado es de $50 millones de pesos, a financiar mediante un esquema de asociación público-privada.\n\nBeneficios esperados:\n- Reducción del 30% en tiempos de traslado\n- Cobertura del 95% de la zona urbana\n- Acceso para personas con discapacidad",
                category="infraestructura",
                scope="municipal",
                status="active",
                author_id=users[1].id,
                vote_count=156,
                support_count=120,
                rejection_count=36,
                comment_count=23,
                deadline=now + timedelta(days=15),
            ),
            Proposal(
                title="Programa de becas digitales para jóvenes",
                summary="Becas de programación y tecnología para jóvenes de 15 a 25 años",
                content="Crear un programa municipal de becas que permita a jóvenes de escasos recursos acceder a cursos de programación, diseño web, marketing digital y otras habilidades tecnológicas.\n\nSe buscarán alianzas con empresas tecnológicas locales y plataformas educativas como Coursera, Platzi y edX.\n\nMeta: 500 jóvenes beneficiados en el primer año.",
                category="educacion",
                scope="municipal",
                status="active",
                author_id=users[2].id,
                vote_count=89,
                support_count=78,
                rejection_count=11,
                comment_count=15,
                deadline=now + timedelta(days=20),
            ),
            Proposal(
                title="Centro de salud comunitario 24/7",
                summary="Construcción de un centro de salud con atención las 24 horas en la zona sur",
                content="La zona sur del municipio carece de servicios de salud nocturnos. Se propone la construcción de un centro comunitario con:\n\n- Consulta general 24/7\n- Urgencias básicas\n- Farmacia comunitaria\n- Laboratorio clínico\n\nUbicación propuesta: Colonia Centro Sur.",
                category="salud",
                scope="municipal",
                status="active",
                author_id=users[1].id,
                vote_count=234,
                support_count=210,
                rejection_count=24,
                comment_count=45,
                deadline=now + timedelta(days=10),
            ),
            Proposal(
                title="Programa de seguridad vecinal",
                summary="Red de vigilancia comunitaria con tecnología y participación ciudadana",
                content="Implementar un sistema de seguridad vecinal que combine:\n\n- Cámaras de vigilancia en puntos estratégicos\n- App de reporte ciudadano\n- Patrullaje comunitario coordinado\n- Iluminación de calles en zonas oscuras\n\nSe estima una reducción del 40% en delitos de bajo impacto.",
                category="seguridad",
                scope="municipal",
                status="active",
                author_id=users[2].id,
                vote_count=178,
                support_count=145,
                rejection_count=33,
                comment_count=32,
                deadline=now + timedelta(days=25),
            ),
            Proposal(
                title="Parque ecológico y centro de reciclaje",
                summary="Creación de un parque ecológico con centro de reciclaje integrado",
                content="Transformar el terreno baldío de la Av. Principal en un parque ecológico que incluya:\n\n- Áreas verdes y senderos\n- Centro de educación ambiental\n- Punto de reciclaje\n- Huerto comunitario\n- Área de juegos infantil con materiales reciclados",
                category="medio_ambiente",
                scope="municipal",
                status="active",
                author_id=users[1].id,
                vote_count=67,
                support_count=55,
                rejection_count=12,
                comment_count=8,
                deadline=now + timedelta(days=30),
            ),
        ]
        db.add_all(proposals)
        db.flush()
        logger.info(f"Created {len(proposals)} proposals")

        # Comments
        comments = [
            Comment(
                content="Excelente propuesta, el transporte es un problema grave en nuestra ciudad.",
                author_id=users[2].id,
                proposal_id=proposals[0].id,
                upvotes=12,
            ),
            Comment(
                content="Me parece muy necesario. Ojalá se apruebe pronto.",
                author_id=users[1].id,
                proposal_id=proposals[1].id,
                upvotes=8,
            ),
            Comment(
                content="La zona sur realmente necesita un centro de salud. Mi familia tiene que viajar 40 minutos para una urgencia.",
                author_id=users[2].id,
                proposal_id=proposals[2].id,
                upvotes=25,
            ),
        ]
        db.add_all(comments)
        db.flush()
        logger.info(f"Created {len(comments)} comments")

        db.commit()
        logger.info("✅ Database seeded successfully!")

    except Exception as e:
        db.rollback()
        import traceback
        error_msg = f"Error seeding database: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise  # Re-raise so the caller can see it
    finally:
        db.close()
